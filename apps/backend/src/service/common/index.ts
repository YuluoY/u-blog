import type { Repository } from 'typeorm'
import { Users } from '@/module/schema/Users'
import { IUserRegisterDto, CUserRole, IUserLogin, IUser, IUserRegister, IUserVo } from '@u-blog/model'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { getRandomString } from '@u-blog/utils'
import type { Request } from 'express'
import { sign, signRt, verify, decode } from '@/plugin/jwt'
import { formatValidationErrors, encrypt, decrypt } from '@/utils'

class CommonService {

  async register(
    req: Request,
    userRepo: Repository<Users>,
    data: IUserRegisterDto,
    ret: number = 0
  )
  {
    // 1、判断用户是否存在
    const exist = await userRepo.findOne({ where: [{ email: data.email }, { username: data.username }] })
    if (exist)
      throw new Error(`用户名或邮箱已被注册`)

    // 2、校验数据
    const errors = await validate(plainToInstance(Users, data))
    if (errors.length > 0)
      throw new Error(formatValidationErrors(errors))

    // 3、密码加密（使用 AES-256-CBC）
    const encryptedPassword = encrypt(data.password)

    // 4、生成刷新令牌的随机字符串密钥
    const rthash = getRandomString(32, 'hex')

    // 5、设置默认值
    const userData = {
      ...data,
      password: encryptedPassword,
      role: data.role || CUserRole.USER, // 默认角色为普通用户
      isActive: data.isActive !== undefined ? data.isActive : true, // 默认激活
      failLoginCount: 0, // 登录失败次数初始化为 0
      lastLoginAt: new Date(), // 最后登录时间设置为当前时间
      rthash, // 刷新令牌密钥
    }

    // 6、创建用户
    const user = userRepo.create(userData)
    await userRepo.save(user)

    // 7、生成访问令牌
    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role
    }
    const token = sign(req, tokenPayload)

    // 8、生成刷新令牌
    const refreshToken = signRt(req, tokenPayload, rthash)

    // 9、更新用户的 token 字段
    user.token = token
    await userRepo.save(user)

    // 10、根据 ret 参数决定返回内容
    if (ret) {
      // 返回完整用户信息（不包含敏感信息）
      const { password, rthash: _, ...userInfo } = user
      return {
        ...userInfo,
        token,
        rt: refreshToken  // 返回给前端，前端可选择性存储或忽略
      }
    } else {
      // 只返回用户ID和令牌
      return {
        id: user.id,
        token,
        rt: refreshToken  // 返回给前端，前端可选择性存储或忽略
      }
    }
  }

  async login(
    req: Request,
    userRepo: Repository<Users>,
    data: { username: string; password: string }
  ) {
    // 1. 查询用户（username 可以是用户名或邮箱）
    const user = await userRepo.findOne({
      where: [
        { username: data.username },
        { email: data.username }
      ],
      select: [
        'id',
        'username',
        'email',
        'password',
        'role',
        'isActive',
        'rthash',
        'failLoginCount',
        'lockoutExpiresAt',
        'avatar',
        'bio',
        'namec',
        'location',
        'website',
        'socials'
      ]
    })

    if (!user) {
      throw new Error('用户不存在')
    }

    // 2. 检查账号是否被锁定
    if (user.lockoutExpiresAt && new Date(user.lockoutExpiresAt) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.lockoutExpiresAt).getTime() - Date.now()) / 60000)
      throw new Error(`账号已被锁定，请 ${remainingMinutes} 分钟后再试`)
    }

    // 3. 检查账号是否激活
    if (user.isActive === false) {
      throw new Error('账号未激活')
    }

    // 4. 解密数据库中的密码并验证
    let decryptedPassword: string
    try {
      decryptedPassword = decrypt(user.password)
    } catch (error) {
      throw new Error('密码数据损坏，请联系管理员')
    }

    if (decryptedPassword !== data.password) {
      // 密码错误，增加失败次数
      user.failLoginCount = (user.failLoginCount || 0) + 1

      // 失败次数达到 5 次，锁定账号 30 分钟
      if (user.failLoginCount >= 5) {
        user.lockoutExpiresAt = new Date(Date.now() + 30 * 60 * 1000)
        await userRepo.save(user)
        throw new Error('密码错误次数过多，账号已被锁定 30 分钟')
      }

      await userRepo.save(user)
      throw new Error(`密码错误，剩余尝试次数：${5 - user.failLoginCount}`)
    }

    // 5. 密码正确，重置失败次数
    user.failLoginCount = 0
    user.lastLoginAt = new Date()

    // 6. 生成新的刷新令牌密钥
    const rthash = getRandomString(32, 'hex')
    user.rthash = rthash

    // 7. 生成访问令牌
    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role
    }
    const token = sign(req, tokenPayload)
    const refreshToken = signRt(req, tokenPayload, rthash)

    // 8. 更新用户的 token 字段
    user.token = token
    await userRepo.save(user)

    // 9. 返回用户信息（不包含敏感信息）
    const { password: _, rthash: __, ...userInfo } = user

    return {
      ...userInfo,
      token,
      rt: refreshToken  // 返回给前端，前端可选择性存储或忽略
    }
  }

  async refreshToken(
    req: Request,
    userRepo: Repository<Users>
  ) {
    // 1. 从 Cookie 中获取刷新令牌
    const rt = req.cookies?.rt
    if (!rt) {
      throw new Error('刷新令牌不存在，请重新登录')
    }

    // 2. 解码刷新令牌获取用户信息（不验证，只解码）
    const decoded = decode<{ id: number; username: string; role: string }>(rt)
    if (!decoded || !decoded.id) {
      throw new Error('无效的刷新令牌')
    }

    // 3. 查询用户
    const user = await userRepo.findOne({
      where: { id: decoded.id },
      select: [
        'id',
        'username',
        'email',
        'role',
        'isActive',
        'rthash',
        'avatar',
        'bio',
        'namec',
        'location',
        'website',
        'socials'
      ]
    })

    if (!user) {
      throw new Error('用户不存在')
    }

    // 4. 检查账号是否激活
    if (user.isActive === false) {
      throw new Error('账号未激活')
    }

    // 5. 使用用户的 rthash 验证刷新令牌
    if (!user.rthash) {
      throw new Error('刷新令牌密钥不存在，请重新登录')
    }

    const verifyResult = verify(rt, user.rthash)
    if (!verifyResult.valid) {
      throw new Error('刷新令牌无效或已过期，请重新登录')
    }

    // 6. 生成新的刷新令牌密钥
    const rthash = getRandomString(32, 'hex')
    user.rthash = rthash

    // 7. 生成新的访问令牌和刷新令牌
    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role
    }
    const token = sign(req, tokenPayload)
    const newRt = signRt(req, tokenPayload, rthash)

    // 8. 更新用户的 token 字段
    user.token = token
    await userRepo.save(user)

    // 9. 返回用户信息和新的令牌
    const { rthash: _, ...userInfo } = user

    return {
      ...userInfo,
      token,
      rt: newRt  // 返回新的刷新令牌（也会通过Cookie发送）
    }
  }
}

export default new CommonService()