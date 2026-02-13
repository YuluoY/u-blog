import { DataSource } from 'typeorm'
import { Users } from '@/module/schema/Users'
import { Article } from '@/module/schema/Article'
import { Category } from '@/module/schema/Category'
import { Tag } from '@/module/schema/Tag'
import { CUserRole, CArticleStatus } from '@u-blog/model'
import { encrypt } from '@/utils'
import { getRandomString } from '@u-blog/utils'
import { createCategory, createTag, generateRandomMarkdown, createArticle } from '@u-blog/model'
import { faker } from '@faker-js/faker/locale/zh_CN'

/**
 * 默认用户数据列表
 */
const DEFAULT_USERS_DATA = [
  {
    username: 'superadmin',
    password: '123456',
    email: 'superadmin@u-blog.com',
    namec: '超级管理员',
    avatar: 'https://avatars.githubusercontent.com/u/29045874',
    bio: '系统超级管理员，拥有所有权限',
    role: CUserRole.SUPER_ADMIN,
    location: '北京市',
    ip: '127.0.0.1',
    website: {
      url: 'https://u-blog.com/',
      title: 'U-Blog 官方网站',
      desc: '一个现代化的博客系统',
      avatar: 'https://avatars.githubusercontent.com/u/29045874'
    },
    socials: [
      {
        name: 'GitHub',
        icon: 'https://github.com/favicon.ico',
        url: 'https://github.com/u-blog'
      }
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
      {
        name: 'Twitter',
        icon: 'https://twitter.com/favicon.ico',
        url: 'https://twitter.com/admin'
      }
    ]
  },
  {
    username: 'huyongle',
    password: '123456',
    email: '568055454@qq.com',
    namec: '雨落',
    avatar: 'https://avatars.githubusercontent.com/u/8129137',
    bio: '开发者，电影爱好者，哲学家',
    role: CUserRole.USER,
    location: '深圳市',
    ip: '247.255.30.201',
    website: {
      url: 'https://unlined-developing.net/',
      title: '年度啊相反教师平坦撕哇哦杏子爬百般',
      desc: 'consectetur',
      avatar: 'https://avatars.githubusercontent.com/u/8129137'
    },
    socials: [
      {
        name: '硕雨涵',
        icon: 'https://avatars.githubusercontent.com/u/8129137',
        url: 'https://new-blowgun.biz/'
      }
    ]
  }
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
 * 初始化假数据（分类、标签、文章）
 * @param dataSource 数据源
 */
export async function initSeedData(dataSource: DataSource): Promise<void> {
  console.log('\n🌱 开始初始化假数据...')
  
  try {
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

    // 4. 创建文章
    console.log('  📝 创建文章...')
    const articleCount = 50 // 创建50篇文章
    let createdCount = 0
    
    for (let i = 0; i < articleCount; i++) {
      const user = faker.helpers.arrayElement(users)
      const category = categories.length > 0 ? faker.helpers.arrayElement([...categories, null]) : null
      const articleTags = tags.length > 0 ? faker.helpers.arrayElements(tags, { min: 1, max: Math.min(5, tags.length) }) : []
      
      // 生成文章标题和内容
      const title = faker.lorem.sentence(faker.number.int({ min: 5, max: 15 })).slice(0, 100)
      const content = generateRandomMarkdown(faker.number.int({ min: 1000, max: 5000 }), 3)
      const desc = faker.lorem.paragraph().substring(0, 255)
      
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
        publishedAt: faker.date.between({ from: '2024-01-01', to: new Date() })
      })
      
      const savedArticle = await articleRepo.save(article)
      
      // 关联标签
      if (articleTags.length > 0) {
        savedArticle.tags = articleTags
        await articleRepo.save(savedArticle)
      }
      
      createdCount++
      if ((i + 1) % 10 === 0) {
        console.log(`    📄 已创建 ${i + 1}/${articleCount} 篇文章`)
      }
    }

    console.log(`  ✅ 文章创建完成，共创建 ${createdCount} 篇`)
    console.log('✨ 假数据初始化完成\n')
  } catch (error) {
    console.error('❌ 初始化假数据失败:', error)
    // 不抛出错误，避免影响应用启动
  }
}

