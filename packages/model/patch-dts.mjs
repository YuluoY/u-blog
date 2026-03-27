import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dtsPath = resolve(__dirname, 'dist/index.d.ts')
const dctsPath = resolve(__dirname, 'dist/index.d.cts')

if (!existsSync(dtsPath)) {
  console.log('dist/index.d.ts 不存在，跳过补丁')
  process.exit(0)
}

let content = readFileSync(dtsPath, 'utf-8')
let patched = false

if (!content.includes('CVisualStyle')) {
const cVisualInject = `declare const CVisualStyle: {
    readonly DEFAULT: "default";
    readonly GLASS: "glass";
};
`
const visualTypeInject = `type VisualStyle = typeof CVisualStyle[keyof typeof CVisualStyle];
`

const cThemeMatch = content.match(/declare const CTheme:[\s\S]*?};/)
if (cThemeMatch) {
  content = content.replace(cThemeMatch[0], cThemeMatch[0] + '\n' + cVisualInject)
}

// 匹配完整一行 type Theme = typeof CTheme[keyof typeof CTheme]; 避免留下残段
const themeTypeMatch = content.match(/type Theme = typeof CTheme\[keyof typeof CTheme\];?\s*\n/)
if (themeTypeMatch) {
  content = content.replace(themeTypeMatch[0], themeTypeMatch[0] + visualTypeInject + '\n')
}

const exportMatch = content.match(/export \{[^}]+\};/)
if (exportMatch) {
  let newExport = exportMatch[0]
    .replace('CTheme,', 'CVisualStyle, CTheme,')
    .replace('type Theme,', 'type Theme, type VisualStyle,')
  content = content.replace(exportMatch[0], newExport)
  patched = true
}
}

if (!content.includes('readonly SKILLS:')) {
  content = content.replace(
    /(readonly TIMELINE: "timeline";)\n(\s+readonly CUSTOM:)/,
    '$1\n    readonly SKILLS: "skills";\n$2'
  )
  patched = true
}

// 注入 CTable 中缺失的字段（FRIEND_LINK / XIAOHUI_CONVERSATION / SUBSCRIBER / ANNOUNCEMENT）
const ctableMissing = [
  ['FRIEND_LINK', 'friend_link'],
  ['XIAOHUI_CONVERSATION', 'xiaohui_conversation'],
  ['SUBSCRIBER', 'subscriber'],
  ['ANNOUNCEMENT', 'announcement'],
]
for (const [key, val] of ctableMissing) {
  if (!content.includes(key)) {
    content = content.replace(
      /(declare const CTable:[\s\S]*?)(\n};)/,
      `$1\n    readonly ${key}: "${val}";$2`
    )
    patched = true
  }
}

// 注入 CGender 和 Gender 类型定义
if (!content.includes('CGender')) {
  const cGenderInject = `declare const CGender: {
    readonly MALE: "male";
    readonly FEMALE: "female";
    readonly OTHER: "other";
    readonly UNSET: "unset";
};
`
  const genderTypeInject = `type Gender = typeof CGender[keyof typeof CGender];
`

  // 在 CTheme 声明之后插入 CGender
  const cThemeBlock = content.match(/declare const CTheme:[\s\S]*?};/)
  if (cThemeBlock) {
    content = content.replace(cThemeBlock[0], cThemeBlock[0] + '\n' + cGenderInject)
  }

  // 在 type Theme = ... 之后插入 type Gender = ...
  const themeTypeForGender = content.match(/type Theme = typeof CTheme\[keyof typeof CTheme\];?\s*\n/)
  if (themeTypeForGender) {
    content = content.replace(themeTypeForGender[0], themeTypeForGender[0] + genderTypeInject + '\n')
  }

  // 追加到 export 列表
  const exportBlock = content.match(/export \{[^}]+\};/)
  if (exportBlock) {
    let newExport = exportBlock[0]
      .replace('CTheme,', 'CGender, CTheme,')
      .replace('type Theme,', 'type Gender, type Theme,')
    content = content.replace(exportBlock[0], newExport)
  }
  patched = true
}

// 注入 IUser 中缺失的 gender 和 birthday 字段
if (!content.includes('gender?: Gender')) {
  // 在 IUser 接口的 role: UserRole; 之后添加 gender 和 birthday
  content = content.replace(
    /(interface IUser[\s\S]*?role: UserRole;\n)/,
    '$1    gender?: Gender;\n    birthday?: Date | null;\n'
  )
  patched = true
}

// 注入 CTable 中缺失的 MOMENT 字段
if (!content.includes('MOMENT')) {
  content = content.replace(
    /(declare const CTable:[\s\S]*?)(\n};)/,
    `$1\n    readonly MOMENT: "moment";$2`
  )
  patched = true
}

// 注入 CMomentImageLayout / CMomentVisibility / IMoment / IMomentDto / IMomentVo 类型定义
if (!content.includes('CMomentImageLayout')) {
  const momentInject = `declare const CMomentImageLayout: {
    readonly GRID: "grid";
    readonly LONG: "long";
    readonly SCROLL: "scroll";
};
type MomentImageLayout = typeof CMomentImageLayout[keyof typeof CMomentImageLayout];
declare const CMomentVisibility: {
    readonly PUBLIC: "public";
    readonly PRIVATE: "private";
};
type MomentVisibility = typeof CMomentVisibility[keyof typeof CMomentVisibility];
interface IMoment extends IBaseSchema, Pick<IBaseFields, 'id'> {
    userId: number;
    user?: IUser;
    content: string;
    images?: string[] | null;
    imageLayout?: MomentImageLayout | null;
    mood?: string | null;
    tags?: string[] | null;
    weather?: string | null;
    visibility: MomentVisibility;
    isPinned: boolean;
    likeCount: number;
    commentCount: number;
}
interface IMomentDto extends Omit<IMoment, keyof IBaseFields | 'deletedAt' | 'user' | 'likeCount' | 'commentCount'> {
}
interface IMomentVo extends Omit<IMoment, 'deletedAt'> {
}
`
  const exportBlock = content.match(/export \{[^}]+\};/)
  if (exportBlock) {
    content = content.replace(exportBlock[0], momentInject + exportBlock[0])
    let newExport = content.match(/export \{[^}]+\};/)[0]
    newExport = newExport.replace(
      'CTheme,',
      'CMomentImageLayout, CMomentVisibility, CTheme,'
    )
    newExport = newExport.replace(
      'type Theme,',
      'type MomentImageLayout, type MomentVisibility, type IMoment, type IMomentDto, type IMomentVo, type Theme,'
    )
    content = content.replace(content.match(/export \{[^}]+\};/)[0], newExport)
  }
  patched = true
}

// 注入 ILike 中缺失的 momentId 字段
if (!content.includes('momentId')) {
  content = content.replace(
    /(interface ILike[\s\S]*?)(commentId\?:)/,
    '$1momentId?: number;\n    moment?: IMoment;\n    $2'
  )
  patched = true
}

// 注入 CFriendLinkStatus / IFriendLink / IFriendLinkDto / IFriendLinkVo 类型定义
if (!content.includes('CFriendLinkStatus')) {
  const cFriendLinkStatusInject = `declare const CFriendLinkStatus: {
    readonly PENDING: "pending";
    readonly APPROVED: "approved";
    readonly REJECTED: "rejected";
};
type FriendLinkStatus = typeof CFriendLinkStatus[keyof typeof CFriendLinkStatus];
interface IFriendLink extends IBaseSchema, Pick<IBaseFields, 'id'> {
    userId: number;
    user?: IUser;
    url: string;
    title: string;
    icon?: string;
    description?: string;
    email?: string;
    status: FriendLinkStatus;
    sortOrder?: number;
}
interface IFriendLinkDto extends Pick<IFriendLink, 'url' | 'title' | 'description' | 'email'> {
    userId?: number;
    icon?: string;
}
interface IFriendLinkVo extends Omit<IFriendLink, 'deletedAt'> {
}
`
  // 在 export 块之前插入
  const exportBlock = content.match(/export \{[^}]+\};/)
  if (exportBlock) {
    content = content.replace(exportBlock[0], cFriendLinkStatusInject + exportBlock[0])
    // 在 export 列表中追加新类型
    let newExport = content.match(/export \{[^}]+\};/)[0]
    newExport = newExport.replace(
      'CTheme,',
      'CFriendLinkStatus, CTheme,'
    )
    // 在 type Theme 之后追加 FriendLink 相关类型
    newExport = newExport.replace(
      'type Theme,',
      'type FriendLinkStatus, type IFriendLink, type IFriendLinkDto, type IFriendLinkVo, type Theme,'
    )
    content = content.replace(content.match(/export \{[^}]+\};/)[0], newExport)
  }
  patched = true
}

writeFileSync(dtsPath, content)
if (existsSync(dctsPath)) {
  writeFileSync(dctsPath, content)
}
console.log(patched ? '已注入 CVisualStyle/VisualStyle 或 CPageBlockType.SKILLS 类型定义' : '已注入 CVisualStyle 和 VisualStyle 类型定义')
