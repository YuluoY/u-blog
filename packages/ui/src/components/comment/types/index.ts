/**
 * 评论组件用到的单条数据结构（与 IComment 兼容，不依赖 @u-blog/model）
 */
export interface UCommentUser {
  namec?: string
  username?: string
  avatar?: string
  [key: string]: unknown
}

export interface UCommentItemData {
  id: number
  userId: number
  user?: UCommentUser | null
  content: string
  path: string
  pid?: number | null
  parent?: UCommentItemData | null
  createdAt?: string | Date
  children?: UCommentItemData[]
  /** IP 解析的地名 */
  ipLocation?: string | null
  /** 浏览器 */
  browser?: string | null
  /** 设备类型 */
  device?: string | null
  /** 游客昵称 */
  nickname?: string | null
  /** 游客邮箱 */
  email?: string | null
}

/**
 * 从邮箱提取 QQ 头像 URL（仅 QQ 邮箱有效）
 * @param email - 邮箱地址
 * @returns QQ 头像 URL，非 QQ 邮箱返回 null
 */
export function getQQAvatarUrl(email?: string | null): string | null {
  if (!email) return null
  const match = email.match(/^(\d{5,11})@qq\.com$/i)
  if (!match) return null
  return `https://q1.qlogo.cn/g?b=qq&nk=${match[1]}&s=100`
}

/**
 * DJB2 哈希：将字符串转为正整数（确定性、分布均匀）
 */
function djb2(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) & 0x7fffffff
  }
  return h
}

/** 从哈希值中提取第 n 位十进制数字 */
function digit(hash: number, n: number): number {
  return Math.floor(hash / 10 ** n) % 10
}

/**
 * 预设调色板：柔和明亮的配色，确保头像色彩丰富且协调
 */
const AVATAR_PALETTE = [
  '#FF6B6B', '#FFA36B', '#FFD93D', '#6BCB77',
  '#4D96FF', '#9B72CF', '#FF6BA3', '#45B7D1',
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#87CEEB',
]

/**
 * 为游客生成确定性随机头像（本地 SVG，无需外部 API）
 * 基于 seed 哈希生成可爱的面部头像，同一 seed 始终产出同一头像
 * @param seed - 用于生成头像的种子字符串（昵称、邮箱等）
 * @returns data:image/svg+xml 格式的头像 URL
 */
export function getRandomAvatarUrl(seed: string): string {
  const name = seed.trim().toLowerCase()
  const hash = djb2(name)
  const hash2 = djb2(name + '~salt')          // 第二个哈希，增加变化

  // 背景色 + 五官色分别从调色板中选取（保证对比度，避免同色）
  const bgIdx = hash % AVATAR_PALETTE.length
  let faceIdx = hash2 % AVATAR_PALETTE.length
  if (faceIdx === bgIdx) faceIdx = (faceIdx + 1) % AVATAR_PALETTE.length
  const bgColor = AVATAR_PALETTE[bgIdx]
  const faceColor = AVATAR_PALETTE[faceIdx]

  // 基于哈希数位生成五官参数
  const faceRotate = digit(hash, 1) * 4 - 18              // 旋转 -18° ~ 18°
  const eyeSpreadX = 10 + digit(hash, 2)                   // 眼间距 10 ~ 19
  const eyeY       = -6 + digit(hash, 3) * 0.5 - 2         // 眼纵坐标微调
  const eyeSize    = 3 + digit(hash, 4) * 0.3               // 眼大小 3 ~ 5.7
  const mouthWidth = 6 + digit(hash, 5)                     // 嘴巴宽度 6 ~ 15
  const mouthCurve = digit(hash, 6)                         // 嘴巴弯曲程度
  const isHappy    = digit(hash, 7) % 3                     // 0=微笑 1=大笑 2=平嘴
  const blushOn    = digit(hash2, 0) > 4                    // 是否有腮红

  // 嘴巴路径
  let mouthPath: string
  const halfW = mouthWidth / 2
  if (isHappy === 0) {
    // 微笑弧线
    mouthPath = `<path d="M${-halfW},6 Q0,${10 + mouthCurve} ${halfW},6" stroke="${faceColor}" stroke-width="2" fill="none" stroke-linecap="round"/>`
  } else if (isHappy === 1) {
    // 大笑（填充的半圆嘴）
    mouthPath = `<path d="M${-halfW},5 Q0,${13 + mouthCurve} ${halfW},5" stroke="${faceColor}" stroke-width="2" fill="${faceColor}" opacity="0.3" stroke-linecap="round"/>`
  } else {
    // 平嘴
    mouthPath = `<line x1="${-halfW}" y1="7" x2="${halfW}" y2="7" stroke="${faceColor}" stroke-width="2" stroke-linecap="round"/>`
  }

  // 腮红
  const blush = blushOn
    ? `<circle cx="-16" cy="4" r="5" fill="${faceColor}" opacity="0.15"/><circle cx="16" cy="4" r="5" fill="${faceColor}" opacity="0.15"/>`
    : ''

  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80">',
    `<rect width="80" height="80" rx="40" fill="${bgColor}"/>`,
    `<g transform="translate(40,40) rotate(${faceRotate})">`,
    // 眼睛
    `<circle cx="${-eyeSpreadX}" cy="${eyeY}" r="${eyeSize}" fill="${faceColor}"/>`,
    `<circle cx="${eyeSpreadX}" cy="${eyeY}" r="${eyeSize}" fill="${faceColor}"/>`,
    // 嘴巴
    mouthPath,
    // 腮红
    blush,
    '</g>',
    '</svg>',
  ].join('')

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/**
 * 获取游客头像 URL：QQ 邮箱 → QQ 头像，其他 → DiceBear 随机头像
 * @param email - 邮箱地址
 * @param nickname - 游客昵称（作为兜底种子）
 * @returns 头像 URL（始终有值）
 */
export function getGuestAvatarUrl(email?: string | null, nickname?: string | null): string {
  // 优先使用 QQ 头像
  const qqAvatar = getQQAvatarUrl(email)
  if (qqAvatar) return qqAvatar
  // 使用邮箱或昵称作为种子生成随机头像
  const seed = email || nickname || 'anonymous'
  return getRandomAvatarUrl(seed)
}

export interface UCommentItemProps {
  /** 单条评论数据 */
  comment: UCommentItemData
  /** 是否渲染为纯文本（不解析 MD） */
  plainContent?: boolean
  /** 当前正在回复的评论 id（由父组件控制） */
  replyingId?: number | null
  /** 回复输入框的值 */
  replyContent?: string
  /** 回复提交中 */
  replyLoading?: boolean
  /** 当前用户是否已登录（控制回复按钮可见） */
  loggedIn?: boolean
  /** 嵌套深度（内部使用） */
  depth?: number
  /** 是否渲染子评论块（列表单级展示时由 List 统一渲染，设为 false） */
  showChildren?: boolean
  /** 博客拥有者 userId，匹配时显示「作者」徽章 */
  ownerUserId?: number | null
}

export interface UCommentItemEmits {
  (e: 'reply', comment: UCommentItemData): void
  (e: 'reply-submit', content: string, comment: UCommentItemData): void
  (e: 'reply-cancel'): void
  (e: 'update:replyContent', value: string): void
  /** 点击「回复 @某人」时触发，用于平滑滚动到目标评论 */
  (e: 'scroll-to', commentId: number): void
}

export interface UCommentListProps {
  list: UCommentItemData[]
  loading?: boolean
  emptyText?: string
  plainContent?: boolean
  replyingId?: number | null
  replyContent?: string
  replyLoading?: boolean
  loggedIn?: boolean
  /** 单条根评论下回复超过该数量时折叠，展示「展开更多 N 条回复」；0 表示不折叠 */
  replyFoldThreshold?: number
  /** 博客拥有者 userId，匹配时显示「作者」徽章 */
  ownerUserId?: number | null
}

export interface UCommentListEmits {
  (e: 'reply', comment: UCommentItemData): void
  (e: 'reply-submit', content: string, comment: UCommentItemData): void
  (e: 'reply-cancel'): void
  (e: 'update:replyContent', value: string): void
  (e: 'scroll-to', commentId: number): void
}

export interface UCommentInputProps {
  placeholder?: string
  maxLength?: number
  submitText?: string
  disabled?: boolean
  loading?: boolean
  modelValue?: string
  /** 紧凑模式（用于内联回复） */
  compact?: boolean
  /** 表情选择器面板主题，传则跟随网站主题；不传则根据 document 的 dark 类推断 */
  emojiPickerTheme?: 'light' | 'dark' | 'auto'
}

export interface UCommentInputEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'submit', content: string): void
  (e: 'cancel'): void
  /** 用户从表情面板选择了表情，由父组件追加到 modelValue */
  (e: 'insert', text: string): void
}

export interface UCommentProps {
  title?: string
  subtitle?: string
  showTitle?: boolean
}

export interface UCommentEmits {
  (e: 'submit', content: string): void
  (e: 'reply', comment: UCommentItemData, content: string): void
}
