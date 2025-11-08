import { DataSource } from 'typeorm'
import { Users } from '@/module/schema/Users'
import { CUserRole } from '@u-blog/model'
import { encrypt } from '@/utils'
import { getRandomString } from '@u-blog/utils'

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

