import { DataSource } from 'typeorm'
import { CTable, CPageBlockType, CUserRole, CArticleStatus, CPermission, CPermissionAction } from '@u-blog/model'
import { Users } from '@/module/schema/Users'
import { Article } from '@/module/schema/Article'
import { Category } from '@/module/schema/Category'
import { Tag } from '@/module/schema/Tag'
import { PageBlock } from '@/module/schema/PageBlock'
import { Role } from '@/module/schema/Role'
import { Permission } from '@/module/schema/Permission'
import { Route } from '@/module/schema/Route'
import { encrypt } from '@/utils'
import { getRandomString } from '@u-blog/utils'
import { createCategory, createTag } from '@u-blog/model'
import { faker } from '@faker-js/faker/locale/zh_CN'
import { getSampleMdByIndex } from './sampleMd'

/** 中文标题前缀/中缀/后缀，用于随机组合 */
const TITLE_PREFIX = ['如何理解', '浅谈', '关于', '一文读懂', '从零开始', '深入理解', '实战', '我的', '日常', '聊聊', '再谈', '小结']
const TITLE_MID = ['Vue', 'React', 'TypeScript', 'Node', '前端', '后端', '数据库', '算法', '设计模式', '工程化', '性能优化', '博客', '生活', '读书', '电影', '旅行', '美食']
const TITLE_SUFFIX = ['实践', '指南', '总结', '笔记', '心得', '入门', '进阶', '踩坑记', '随想', '分享']

/** 中文段落常用词，用于生成正文 */
const ZH_WORDS = '的技术开发学习实践应用方法经验总结笔记心得分享理解掌握提升优化改进设计实现代码项目框架工具库函数模块组件状态数据接口请求响应渲染更新配置部署测试调试错误问题解决方案思路步骤流程规范约定风格'.split('')
const ZH_PHRASES = ['在实际开发中', '需要注意的是', '简单来说', '举个例子', '从另一个角度', '总的来说', '首先我们要', '接下来', '最后', '因此', '然而', '另外', '同时', '一方面', '另一方面']

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomChineseTitle(): string {
  const a = pick(TITLE_PREFIX)
  const b = pick(TITLE_MID)
  const c = pick(TITLE_SUFFIX)
  if (faker.datatype.boolean(0.5)) {
    return `${a}${b}${c}`.slice(0, 50)
  }
  return `${a}${b}：${c}与${pick(TITLE_MID)}`.slice(0, 50)
}

function randomChineseParagraph(minLen: number, maxLen: number): string {
  const len = faker.number.int({ min: minLen, max: maxLen })
  let s = ''
  while (s.length < len) {
    if (faker.datatype.boolean(0.3) && s.length > 10) {
      s += pick(ZH_PHRASES)
    } else {
      s += pick(ZH_WORDS)
    }
  }
  return s.slice(0, len)
}

/** 生成中文 Markdown 正文 */
function generateChineseMarkdown(targetLength: number): string {
  const parts: string[] = []
  let len = 0
  const headings = ['## 前言', '## 背景与动机', '## 实现思路', '## 具体步骤', '## 小结', '## 参考资料']
  let hi = 0
  while (len < targetLength) {
    if (hi < headings.length && len < targetLength * 0.85) {
      parts.push('\n' + headings[hi] + '\n\n')
      len += headings[hi].length + 4
      hi++
    }
    const pLen = Math.min(targetLength - len - 2, faker.number.int({ min: 80, max: 300 }))
    if (pLen <= 0) break
    parts.push(randomChineseParagraph(pLen, pLen) + '\n\n')
    len += pLen + 2
  }
  return '# 正文\n\n' + parts.join('').slice(0, targetLength)
}

/* ====================================================================
 *  RBAC 种子数据：角色 / 权限 / 路由
 * ==================================================================== */

/** 默认权限种子 */
const DEFAULT_PERMISSIONS = [
  // --- 菜单权限 ---
  { name: '仪表盘', code: 'menu:dashboard', type: CPermission.MENU, action: CPermissionAction.READ, resource: '/dashboard', desc: '仪表盘菜单' },
  { name: '文章管理', code: 'menu:articles', type: CPermission.MENU, action: CPermissionAction.READ, resource: '/articles', desc: '文章管理菜单' },
  { name: '分类管理', code: 'menu:categories', type: CPermission.MENU, action: CPermissionAction.READ, resource: '/categories', desc: '分类管理菜单' },
  { name: '标签管理', code: 'menu:tags', type: CPermission.MENU, action: CPermissionAction.READ, resource: '/tags', desc: '标签管理菜单' },
  { name: '评论管理', code: 'menu:comments', type: CPermission.MENU, action: CPermissionAction.READ, resource: '/comments', desc: '评论管理菜单' },
  { name: '用户管理', code: 'menu:users', type: CPermission.MENU, action: CPermissionAction.READ, resource: '/users', desc: '用户管理菜单' },
  { name: '媒体管理', code: 'menu:media', type: CPermission.MENU, action: CPermissionAction.READ, resource: '/media', desc: '媒体管理菜单' },
  { name: '友链管理', code: 'menu:friend-links', type: CPermission.MENU, action: CPermissionAction.READ, resource: '/friend-links', desc: '友链管理菜单' },
  { name: '设置', code: 'menu:settings', type: CPermission.MENU, action: CPermissionAction.READ, resource: '/settings', desc: '设置菜单' },
  { name: '关于页区块', code: 'menu:about-blocks', type: CPermission.MENU, action: CPermissionAction.READ, resource: '/about-blocks', desc: '关于页区块菜单' },
  { name: '数据分析', code: 'menu:analytics', type: CPermission.MENU, action: CPermissionAction.READ, resource: '/analytics', desc: '数据分析菜单' },
  { name: '角色管理', code: 'menu:roles', type: CPermission.MENU, action: CPermissionAction.READ, resource: '/roles', desc: '角色管理菜单' },
  { name: '权限管理', code: 'menu:permissions', type: CPermission.MENU, action: CPermissionAction.READ, resource: '/permissions', desc: '权限管理菜单' },
  { name: '路由管理', code: 'menu:routes', type: CPermission.MENU, action: CPermissionAction.READ, resource: '/routes', desc: '路由管理菜单' },
  { name: '小惠对话', code: 'menu:xiaohui', type: CPermission.MENU, action: CPermissionAction.READ, resource: '/xiaohui', desc: '小惠 AI 对话管理菜单' },
  // --- API 权限 ---
  { name: '文章创建', code: 'api:article:create', type: CPermission.API, action: CPermissionAction.CREATE, resource: 'article', desc: '创建文章' },
  { name: '文章编辑', code: 'api:article:update', type: CPermission.API, action: CPermissionAction.UPDATE, resource: 'article', desc: '编辑文章' },
  { name: '文章删除', code: 'api:article:delete', type: CPermission.API, action: CPermissionAction.DELETE, resource: 'article', desc: '删除文章' },
  { name: '评论删除', code: 'api:comment:delete', type: CPermission.API, action: CPermissionAction.DELETE, resource: 'comment', desc: '删除评论' },
  { name: '用户编辑', code: 'api:user:update', type: CPermission.API, action: CPermissionAction.UPDATE, resource: 'users', desc: '编辑用户信息' },
  { name: '设置写入', code: 'api:setting:update', type: CPermission.API, action: CPermissionAction.UPDATE, resource: 'setting', desc: '修改系统设置' },
  { name: '媒体上传', code: 'api:media:create', type: CPermission.API, action: CPermissionAction.CREATE, resource: 'media', desc: '上传媒体文件' },
  { name: '友链审核', code: 'api:friend-link:update', type: CPermission.API, action: CPermissionAction.UPDATE, resource: 'friend_link', desc: '审核友链申请' },
  // --- 按钮权限 ---
  { name: '批量删除', code: 'btn:batch-delete', type: CPermission.BUTTON, action: CPermissionAction.DELETE, resource: '*', desc: '批量删除按钮' },
  { name: '数据导出', code: 'btn:export', type: CPermission.BUTTON, action: CPermissionAction.READ, resource: '*', desc: '数据导出按钮' },
] as const

/** 默认角色种子及其权限绑定（通过 code 引用权限） */
const DEFAULT_ROLES: Array<{ name: string; desc: string; permissionCodes: string[] }> = [
  {
    name: CUserRole.SUPER_ADMIN,
    desc: '超级管理员，拥有所有权限',
    permissionCodes: DEFAULT_PERMISSIONS.map(p => p.code), // 所有权限
  },
  {
    name: CUserRole.ADMIN,
    desc: '管理员，拥有内容管理和审核权限',
    permissionCodes: [
      'menu:dashboard', 'menu:articles', 'menu:categories', 'menu:tags',
      'menu:comments', 'menu:users', 'menu:media', 'menu:friend-links',
      'menu:settings', 'menu:about-blocks', 'menu:analytics', 'menu:xiaohui',
      'api:article:create', 'api:article:update', 'api:article:delete',
      'api:comment:delete', 'api:user:update', 'api:setting:update',
      'api:media:create', 'api:friend-link:update',
      'btn:batch-delete', 'btn:export',
    ],
  },
  {
    name: CUserRole.USER,
    desc: '普通用户，拥有基础浏览和发布权限',
    permissionCodes: [
      'menu:dashboard',
      'api:article:create', 'api:article:update',
      'api:media:create',
    ],
  },
]

/** 默认前端路由种子 */
const DEFAULT_ROUTES = [
  { name: 'home',     path: '/home',       title: '首页',     icon: 'HomeOutlined',      isKeepAlive: true,  isAffix: true,  isExact: false, isProtected: false, isHero: false, isLeftSide: true,  isRightSide: true,  isVisible: true  },
  { name: 'archive',  path: '/archive',    title: '归档',     icon: 'ContainerOutlined', isKeepAlive: true,  isAffix: true,  isExact: false, isProtected: false, isHero: false, isLeftSide: true,  isRightSide: true,  isVisible: true  },
  { name: 'about',    path: '/about',      title: '关于',     icon: 'UserOutlined',      isKeepAlive: true,  isAffix: true,  isExact: false, isProtected: false, isHero: false, isLeftSide: false, isRightSide: false, isVisible: true  },
  { name: 'message',  path: '/message',    title: '留言',     icon: 'MessageOutlined',   isKeepAlive: true,  isAffix: true,  isExact: false, isProtected: false, isHero: false, isLeftSide: false, isRightSide: false, isVisible: true  },
  { name: 'links',    path: '/links',      title: '友链',     icon: 'LinkOutlined',      isKeepAlive: true,  isAffix: true,  isExact: false, isProtected: false, isHero: false, isLeftSide: false, isRightSide: false, isVisible: true  },
  { name: 'chat',     path: '/chat',       title: '助手',     icon: 'RobotOutlined',     isKeepAlive: true,  isAffix: true,  isExact: false, isProtected: true,  isHero: false, isLeftSide: false, isRightSide: false, isVisible: true  },
  { name: 'xiaohui',  path: '/xiaohui',    title: '小惠',     icon: 'SmileOutlined',     isKeepAlive: true,  isAffix: true,  isExact: false, isProtected: false, isHero: false, isLeftSide: false, isRightSide: false, isVisible: true  },
  { name: 'read',     path: '/read/:id',   title: '阅读',     icon: 'ReadOutlined',      isKeepAlive: false, isAffix: false, isExact: false, isProtected: false, isHero: false, isLeftSide: false, isRightSide: false, isVisible: true  },
  { name: 'userBlog', path: '/@:username', title: '用户博客', icon: 'TeamOutlined',      isKeepAlive: false, isAffix: false, isExact: false, isProtected: false, isHero: false, isLeftSide: false, isRightSide: false, isVisible: true  },
  { name: 'login',    path: '/login',      title: '登录',     icon: 'LoginOutlined',     isKeepAlive: false, isAffix: false, isExact: false, isProtected: false, isHero: false, isLeftSide: false, isRightSide: false, isVisible: true  },
  { name: 'write',    path: '/write',      title: '写作',     icon: 'EditOutlined',      isKeepAlive: false, isAffix: false, isExact: false, isProtected: true,  isHero: false, isLeftSide: false, isRightSide: false, isVisible: true  },
]

/**
 * 初始化 RBAC 种子数据（角色、权限、路由）
 * 幂等操作：已存在则跳过
 */
export async function initRBAC(dataSource: DataSource): Promise<void> {
  console.log('\n🔐 开始初始化 RBAC 种子数据...')

  try {
    const permRepo = dataSource.getRepository(Permission)
    const roleRepo = dataSource.getRepository(Role)
    const routeRepo = dataSource.getRepository(Route)

    // 1. 权限
    console.log('  🔑 初始化权限...')
    const permissionMap = new Map<string, Permission>()
    for (const p of DEFAULT_PERMISSIONS) {
      try {
        let existing = await permRepo.findOne({ where: { code: p.code } })
        if (!existing) {
          existing = permRepo.create({
            name: p.name,
            code: p.code,
            type: p.type,
            action: p.action,
            resource: p.resource,
            desc: p.desc,
          })
          existing = await permRepo.save(existing)
          console.log(`    ✅ 权限创建: ${p.code}`)
        } else {
          console.log(`    ℹ️  权限已存在: ${p.code}`)
        }
        permissionMap.set(p.code, existing)
      } catch (err) {
        console.warn(`    ⚠️  权限初始化失败: ${p.code}`, (err as Error).message)
      }
    }

    // 2. 角色（含权限绑定）
    console.log('  👥 初始化角色...')
    for (const r of DEFAULT_ROLES) {
      let existing = await roleRepo.findOne({ where: { name: r.name }, relations: ['permissions'] })
      if (!existing) {
        const perms = r.permissionCodes
          .map(code => permissionMap.get(code))
          .filter(Boolean) as Permission[]
        existing = roleRepo.create({ name: r.name, desc: r.desc })
        existing.permissions = perms
        await roleRepo.save(existing)
        console.log(`    ✅ 角色创建: ${r.name}（${perms.length} 项权限）`)
      } else {
        console.log(`    ℹ️  角色已存在: ${r.name}`)
      }
    }

    // 3. 路由
    console.log('  🗺️  初始化路由...')
    for (const rt of DEFAULT_ROUTES) {
      let existing = await routeRepo.findOne({ where: { name: rt.name } })
      if (!existing) {
        existing = routeRepo.create(rt)
        await routeRepo.save(existing)
        console.log(`    ✅ 路由创建: ${rt.name} (${rt.path})`)
      } else {
        // 补全已有路由缺失的 isVisible 字段（旧数据可能为 NULL）
        if (existing.isVisible === undefined || existing.isVisible === null) {
          existing.isVisible = rt.isVisible ?? true
          await routeRepo.save(existing)
          console.log(`    🔧 路由补全 isVisible: ${rt.name}`)
        } else {
          console.log(`    ℹ️  路由已存在: ${rt.name}`)
        }
      }
    }

    console.log('✨ RBAC 种子数据初始化完成\n')
  } catch (error) {
    console.error('❌ 初始化 RBAC 种子数据失败:', error)
  }
}

/**
 * 默认用户数据列表
 * huyongle 为站长（super_admin），初始化后游客默认看到此用户的数据
 */
const DEFAULT_USERS_DATA = [
  {
    username: 'huyongle',
    password: '123456',
    email: '568055454@qq.com',
    namec: '雨落',
    avatar: 'https://q1.qlogo.cn/g?b=qq&nk=568055454&s=100',
    bio: '全栈开发者，开源爱好者，记录技术与生活',
    role: CUserRole.SUPER_ADMIN,
    location: '深圳市',
    ip: '127.0.0.1',
    website: {
      url: 'https://u-blog.com/',
      title: 'U-Blog',
      desc: '一个现代化的博客系统',
      avatar: 'https://q1.qlogo.cn/g?b=qq&nk=568055454&s=100'
    },
    socials: [
      { name: 'GitHub', icon: 'https://github.com/favicon.ico', url: 'https://github.com/huyongle' },
    ]
  },
  {
    username: 'admin',
    password: '123456',
    email: 'admin@u-blog.com',
    namec: '管理员',
    avatar: 'https://avatars.githubusercontent.com/u/4220937',
    bio: '系统管理员，负责内容管理和审核',
    role: CUserRole.ADMIN,
    location: '上海市',
    ip: '127.0.0.2',
    website: {
      url: 'https://admin.u-blog.com/',
      title: '管理员博客',
      desc: '分享管理经验',
      avatar: 'https://avatars.githubusercontent.com/u/4220937'
    },
    socials: [
      { name: 'GitHub', icon: 'https://github.com/favicon.ico', url: 'https://github.com/admin' },
    ]
  },
  {
    username: 'testuser',
    password: '123456',
    email: 'testuser@u-blog.com',
    namec: '测试用户',
    avatar: 'https://avatars.githubusercontent.com/u/583231',
    bio: '普通用户，喜欢阅读和写作',
    role: CUserRole.USER,
    location: '北京市',
    ip: '127.0.0.3',
    website: {
      url: 'https://testuser.u-blog.com/',
      title: '测试博客',
      desc: '我的个人博客',
      avatar: 'https://avatars.githubusercontent.com/u/583231'
    },
    socials: [
      { name: 'GitHub', icon: 'https://github.com/favicon.ico', url: 'https://github.com/testuser' },
    ]
  },
]

/**
 * 创建单个默认用户
 * @param userRepo 用户仓储
 * @param userData 用户数据
 */
async function createDefaultUser(userRepo: any, userData: typeof DEFAULT_USERS_DATA[0]): Promise<void> {
  // 1、检查用户是否已存在（通过邮箱或用户名判断）
  const existingUser = await userRepo.findOne({
    where: [
      { email: userData.email },
      { username: userData.username }
    ]
  })

  // 如果用户已存在，跳过创建
  if (existingUser) {
    console.log(`  ℹ️  用户已存在: ${userData.username} (${userData.namec}) [${userData.role}]`)
    return
  }

  // 2、密码加密
  const encryptedPassword = encrypt(userData.password)

  // 3、生成刷新令牌的随机字符串密钥
  const rthash = getRandomString(32, 'hex')

  // 4、创建用户数据
  const newUserData = {
    ...userData,
    password: encryptedPassword,
    isActive: true,
    failLoginCount: 0,
    lastLoginAt: new Date(),
    rthash
  }

  // 5、保存用户
  const user = userRepo.create(newUserData)
  await userRepo.save(user)

  console.log(`  ✅ 用户创建成功: ${userData.username} (${userData.namec}) [${userData.role}] - ID: ${user.id}`)
}

/**
 * 初始化默认用户
 * @param dataSource 数据源
 */
export async function initDefaultUser(dataSource: DataSource): Promise<void> {
  console.log('\n🚀 开始初始化默认用户...')
  
  try {
    const userRepo = dataSource.getRepository(Users)

    // 循环创建所有默认用户
    for (const userData of DEFAULT_USERS_DATA) {
      await createDefaultUser(userRepo, userData)
    }

    console.log('✨ 默认用户初始化完成\n')
  } catch (error) {
    console.error('❌ 初始化默认用户失败:', error)
    // 不抛出错误，避免影响应用启动
  }
}

/**
 * 清空种子数据（文章、文章-标签关联、标签、分类），不删用户
 * 使用 TRUNCATE ... CASCADE 自动清理所有外键依赖（view、like、comment 等）
 */
export async function clearSeedData(dataSource: DataSource): Promise<void> {
  const qr = dataSource.createQueryRunner()
  await qr.connect()
  try {
    // CASCADE 会自动处理 view/like/comment/activity_log 等依赖 article 的表
    await qr.query(
      `TRUNCATE TABLE "${CTable.ARTICLE_TAG}", "${CTable.ARTICLE}", "${CTable.TAG}", "${CTable.CATEGORY}" RESTART IDENTITY CASCADE`
    )
    console.log('  🗑️  已清空文章、标签、分类及所有关联表')
  } catch (e) {
    throw e
  } finally {
    await qr.release()
  }
}

/**
 * 初始化假数据（分类、标签、文章）
 * @param dataSource 数据源
 */
export async function initSeedData(dataSource: DataSource): Promise<void> {
  console.log('\n🌱 开始初始化假数据...')
  
  try {
    await clearSeedData(dataSource)
    const userRepo = dataSource.getRepository(Users)
    const categoryRepo = dataSource.getRepository(Category)
    const tagRepo = dataSource.getRepository(Tag)
    const articleRepo = dataSource.getRepository(Article)

    // 1. 获取所有用户（用于关联）
    const users = await userRepo.find()
    if (users.length === 0) {
      console.log('  ⚠️  没有找到用户，跳过假数据初始化')
      return
    }

    // 2. 创建分类
    console.log('  📁 创建分类...')
    const categories: Category[] = []
    const categoryNames = ['技术', '生活', '旅行', '美食', '读书', '电影', '音乐', '运动']
    
    for (const name of categoryNames) {
      const existing = await categoryRepo.findOne({ where: { name } })
      if (!existing) {
        const categoryData = createCategory()
        const desc = (categoryData.desc || `关于${name}的分类`).slice(0, 255)
        const category = categoryRepo.create({
          name,
          desc,
          userId: faker.helpers.arrayElement(users).id
        })
        const saved = await categoryRepo.save(category)
        categories.push(saved)
        console.log(`    ✅ 分类创建成功: ${name}`)
      } else {
        categories.push(existing)
        console.log(`    ℹ️  分类已存在: ${name}`)
      }
    }

    // 3. 创建标签
    console.log('  🏷️  创建标签...')
    const tags: Tag[] = []
    const tagNames = ['Vue', 'React', 'TypeScript', 'Node.js', 'Python', 'Java', 'Go', 'Rust', '前端', '后端', '全栈', 'AI', '机器学习', '区块链', 'Web3']
    
    for (const name of tagNames) {
      const existing = await tagRepo.findOne({ where: { name } })
      if (!existing) {
        const tagData = createTag()
        const desc = (tagData.desc || `关于${name}的标签`).slice(0, 255)
        const tag = tagRepo.create({
          name,
          desc,
          color: tagData.color?.slice(0, 50) ?? null,
          userId: faker.helpers.arrayElement(users).id
        })
        const saved = await tagRepo.save(tag)
        tags.push(saved)
        console.log(`    ✅ 标签创建成功: ${name}`)
      } else {
        tags.push(existing)
        console.log(`    ℹ️  标签已存在: ${name}`)
      }
    }

    // 4. 创建文章（50 篇，faker 填充、多种 MD 格式、每篇至少 3000 字）
    const articleCount = 50
    console.log('  📝 创建文章...')
    let createdCount = 0
    
    for (let i = 0; i < articleCount; i++) {
      const user = faker.helpers.arrayElement(users)
      const category = categories.length > 0 ? faker.helpers.arrayElement([...categories, null]) : null
      const articleTags = tags.length > 0 ? faker.helpers.arrayElements(tags, { min: 1, max: Math.min(5, tags.length) }) : []
      // 标题加序号保证唯一，避免违反 title 唯一约束
      const title = `${randomChineseTitle()}（${i + 1}）`.slice(0, 100)
      const content = getSampleMdByIndex(i) // 多篇高质量 MD 模板轮询，内容不重复
      const desc = randomChineseParagraph(50, 120).slice(0, 255)
      const publishedAt = faker.date.between({ from: '2024-01-01', to: new Date() })
      const article = articleRepo.create({
        userId: user.id,
        categoryId: category?.id || null,
        title,
        content,
        desc: desc || null,
        status: CArticleStatus.PUBLISHED,
        cover: faker.helpers.arrayElement([faker.image.url(), null]),
        isPrivate: false,
        isTop: i < 3, // 前3篇置顶
        commentCount: faker.number.int({ min: 0, max: 50 }),
        likeCount: faker.number.int({ min: 0, max: 100 }),
        viewCount: faker.number.int({ min: 0, max: 1000 }),
        publishedAt,
        createdAt: publishedAt,
        updatedAt: publishedAt
      } as any)
      
      const saveResult = await articleRepo.save(article)
      const savedArticle = Array.isArray(saveResult) ? saveResult[0] : saveResult
      
      // 关联标签
      if (articleTags.length > 0 && savedArticle) {
        ;(savedArticle as Article).tags = articleTags
        await articleRepo.save(savedArticle)
      }
      
      createdCount++
      if ((i + 1) % 10 === 0) {
        console.log(`    📄 已创建 ${i + 1}/${articleCount} 篇文章`)
      }
    }

    console.log(`  ✅ 文章创建完成，共创建 ${createdCount} 篇`)

    // 5. 关于页区块：若无 about 区块则插入示例；若有区块但缺少「我的介绍」则补插
    const WHOAMI_CONTENT = `此人，常年出没于屏幕与书本之间。一读书就钻进去不肯出来，路遥、余华、马伯庸轮番上阵，读完了不写几行就心里堵；真动笔又常拖稿，心不静时像挤牙膏，权当和脑子里那头不肯睡觉的野兽签了长期共处协议。

工作之外，和几个发小厮混了二十年：台球桌上互相嫌弃，大闸蟹桌上互相教学怎么啃腿，看比赛时一起骂街或一起沉默。一个人时也不闲着，会突然出门用脚丈量城市，美其名曰「抵抗一眼望到头的日子」。

永远相信美好的事情即将发生。这里记点技术碎碎念和生活流水账，想到哪写到哪。`
    const pageBlockRepo = dataSource.getRepository(PageBlock)
    const aboutBlockCount = await pageBlockRepo.count({ where: { page: 'about' } })
    if (aboutBlockCount === 0) {
      console.log('  📄 创建关于页示例区块...')
      const whoamiBlock = pageBlockRepo.create({
        page: 'about',
        sortOrder: 0,
        type: CPageBlockType.WHOAMI,
        title: '我的介绍',
        content: WHOAMI_CONTENT,
      })
      await pageBlockRepo.save(whoamiBlock)
      const introBlock = pageBlockRepo.create({
        page: 'about',
        sortOrder: 1,
        type: CPageBlockType.INTRO,
        title: '关于本站',
        content: '欢迎来到本站。这里记录技术笔记与生活随想。\n\n- 使用 **Markdown** 书写\n- 支持时间线、简介等多种区块类型\n- 可在后台「关于页区块」中编辑',
      })
      await pageBlockRepo.save(introBlock)
      const skillsBlock = pageBlockRepo.create({
        page: 'about',
        sortOrder: 2,
        type: CPageBlockType.SKILLS,
        title: '技术栈与熟练度',
        content: '',
        extra: {
          groups: [
            {
              name: '前端',
              items: [
                { name: 'Vue 3', level: 4 },
                { name: 'TypeScript', level: 4 },
                { name: 'React', level: 3 },
                { name: 'Vite / 工程化', level: 4 },
              ],
            },
            {
              name: 'JavaScript',
              items: [{ name: 'JavaScript', level: 4 }],
            },
            {
              name: '后端 / 运维',
              items: [
                { name: 'Node.js', level: 4 },
                { name: 'NestJS', level: 3 },
                { name: 'SQL / 数据库', level: 3 },
                { name: 'Nginx / Linux', level: 3 },
              ],
            },
            {
              name: '工具与其它',
              items: [
                { name: 'Git', level: 4 },
                { name: 'Docker', level: 3 },
              ],
            },
            {
              name: 'AI Coding',
              items: [{ name: 'Cursor / Copilot 等', level: 4 }],
            },
            {
              name: '文档',
              items: [{ name: 'Markdown / 文档', level: 5 }],
            },
          ],
        },
      })
      await pageBlockRepo.save(skillsBlock)
      const timelineBlock = pageBlockRepo.create({
        page: 'about',
        sortOrder: 3,
        type: CPageBlockType.TIMELINE,
        title: '时间线',
        content: '',
        extra: {
          items: [
            { year: '2024', title: '博客上线', desc: '基于 U-Blog 搭建' },
            { year: '2023', title: '学习与积累', desc: '持续输出技术文章' },
          ],
        },
      })
      await pageBlockRepo.save(timelineBlock)
      console.log('    ✅ 关于页示例区块已创建（含「我的介绍」）')
    } else {
      const hasWhoami = await pageBlockRepo.findOne({
        where: { page: 'about', type: CPageBlockType.WHOAMI },
      })
      if (!hasWhoami) {
        console.log('  📄 关于页已有区块，补插「我的介绍」...')
        await pageBlockRepo.increment({ page: 'about' }, 'sortOrder', 1)
        const whoamiBlock = pageBlockRepo.create({
          page: 'about',
          sortOrder: 0,
          type: CPageBlockType.WHOAMI,
          title: '我的介绍',
          content: WHOAMI_CONTENT,
        })
        await pageBlockRepo.save(whoamiBlock)
        console.log('    ✅ 已补插「我的介绍」区块')
      }
      const hasSkills = await pageBlockRepo.findOne({
        where: { page: 'about', type: CPageBlockType.SKILLS },
      })
      if (!hasSkills) {
        console.log('  📄 关于页补插「技术栈与熟练度」...')
        const aboutBlocks = await pageBlockRepo.find({
          where: { page: 'about' },
          order: { sortOrder: 'ASC' },
        })
        const insertOrder = 2
        for (const b of aboutBlocks) {
          if (b.sortOrder >= insertOrder)
            await pageBlockRepo.update({ id: b.id }, { sortOrder: b.sortOrder + 1 })
        }
        const skillsBlock = pageBlockRepo.create({
          page: 'about',
          sortOrder: insertOrder,
          type: CPageBlockType.SKILLS,
          title: '技术栈与熟练度',
          content: '',
          extra: {
            groups: [
              {
                name: '前端',
                items: [
                  { name: 'Vue 3', level: 4 },
                  { name: 'TypeScript', level: 4 },
                  { name: 'React', level: 3 },
                  { name: 'Vite / 工程化', level: 4 },
                ],
              },
              {
                name: 'JavaScript',
                items: [{ name: 'JavaScript', level: 4 }],
              },
              {
                name: '后端 / 运维',
                items: [
                  { name: 'Node.js', level: 4 },
                  { name: 'NestJS', level: 3 },
                  { name: 'SQL / 数据库', level: 3 },
                  { name: 'Nginx / Linux', level: 3 },
                ],
              },
              {
                name: '工具与其它',
                items: [
                  { name: 'Git', level: 4 },
                  { name: 'Docker', level: 3 },
                ],
              },
              {
                name: 'AI Coding',
                items: [{ name: 'Cursor / Copilot 等', level: 4 }],
              },
              {
                name: '文档',
                items: [{ name: 'Markdown / 文档', level: 5 }],
              },
            ],
          },
        })
        await pageBlockRepo.save(skillsBlock)
        console.log('    ✅ 已补插「技术栈与熟练度」区块')
      }
    }

    console.log('✨ 假数据初始化完成\n')
  } catch (error) {
    console.error('❌ 初始化假数据失败:', error)
    // 不抛出错误，避免影响应用启动
  }
}

