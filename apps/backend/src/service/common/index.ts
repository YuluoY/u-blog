import type { Repository } from 'typeorm'
import type { Request } from 'express'
import { Users } from '@/module/schema/Users'
import { Media } from '@/module/schema/Media'
import { Article } from '@/module/schema/Article'
import { Category } from '@/module/schema/Category'
import { Tag } from '@/module/schema/Tag'
import { Setting } from '@/module/schema/Setting'
import { UserSetting } from '@/module/schema/UserSetting'
import { View } from '@/module/schema/View'
import { Likes } from '@/module/schema/Likes'
import { Comment } from '@/module/schema/Comment'
import { FriendLink } from '@/module/schema/FriendLink'
import {
  IUserRegisterDto, CUserRole, IUserLogin, IUser,
  IUserRegister, IUserVo, CArticleStatus, CFriendLinkStatus,
} from '@u-blog/model'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { getRandomString } from '@u-blog/utils'
import { sign, signRt, verify, decode } from '@/plugin/jwt'
import { formatValidationErrors, encrypt, decrypt, decryptTransport, getDataSource } from '@/utils'
import bcrypt from 'bcrypt'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import appCfg from '@/app'
import { createTransporter, sendMail } from '@/plugin/mailer'

/* ========== 类型定义 ========== */

/** 上传结果 */
export interface UploadResult {
  url: string
  mediaId: number
  name: string
  size: number
  mimeType: string
}

/** 搜索范围 */
export type SearchScope = 'title' | 'content' | 'desc' | 'all'

/** 文章搜索结果项 */
export interface ArticleSearchItem {
  id: number
  title: string
  desc: string | null
  publishedAt: string
  /** 命中片段（来自正文或描述），用于列表展示与高亮 */
  snippet: string | null
}

/** 词云权重项 */
export interface CloudItem {
  id: number
  name: string
  /** 权重：使用该分类/标签的已发布文章数 */
  weight: number
  /** 声噪（信噪比）：归一化后的权重 0~1，越大表示越突出 */
  signalNoise: number
}

/** 词云权重数据 */
export interface CloudWeightsData {
  categories: (CloudItem & { desc?: string | null })[]
  tags: (CloudItem & { color?: string | null })[]
}

/** 网站概览数据 */
export interface SiteOverviewData {
  articleCount: number
  categoryCount: number
  tagCount: number
  totalViews: number
  totalUniqueVisitors: number
  totalLikes: number
  totalComments: number
  runningDays: number
  lastUpdate: string
}

/** 设置项 */
export interface SettingItem {
  key: string
  value: unknown
  desc?: string | null
  masked?: boolean
}

/* ========== 私有工具函数 ========== */

/** 计算文件 MD5 哈希 */
function computeFileHash(filePath: string): string {
  const buffer = fs.readFileSync(filePath)
  return crypto.createHash('md5').update(buffer).digest('hex')
}

/** 从 MIME 类型提取主类型（image / video / audio / document） */
function resolveMediaType(mimeType: string): string {
  const main = mimeType.split('/')[0]
  if (['image', 'video', 'audio'].includes(main)) return main
  return 'document'
}

/**
 * 修正 multer 解析 multipart 时原始文件名的编码问题
 * multer 以 latin1 读取 filename，中文等非 ASCII 字符会乱码
 */
function fixOriginalName(raw: string): string {
  try {
    return Buffer.from(raw, 'latin1').toString('utf8')
  } catch {
    return raw
  }
}

/** 需脱敏的设置 key（返回时只展示前几位 + ***） */
const MASK_KEYS = new Set([
  'openai_api_key',
  // openai_base_url 不再脱敏：它不是机密信息，脱敏会导致前端回显为空并在下次保存时覆盖为空
  'anthropic_api_key',
  'api_key',
])

/**
 * 用户级别设置 key — 存储在 user_setting 表中，按 userId 隔离。
 * 不在此集合内的 key 仍使用全局 setting 表。
 */
const USER_SCOPED_KEYS = new Set([
  'openai_api_key', 'openai_base_url', 'openai_model',
  'openai_temperature', 'openai_max_tokens', 'openai_system_prompt', 'openai_context_length',
  'chat_font_size',
  // 站点信息：每个用户可拥有独立的站点元信息
  'site_name', 'site_description', 'site_keywords', 'site_favicon',
  // 多租户：用户个人博客设置
  'visible_routes', 'friend_link_notify', 'only_own_articles', 'blog_theme',
  // 博客分享模式：readonly / full（决定访客可用功能范围）
  'blog_share_mode',
])

/** 脱敏值 */
function maskValue(val: unknown): string {
  if (typeof val !== 'string') return '***'
  if (val.length <= 6) return '***'
  return `${val.slice(0, 4)}***`
}

/** 文章搜索相关常量 */
const DEFAULT_SEARCH_LIMIT = 20
const SNIPPET_MAX_LEN = 120
const SNIPPET_CONTEXT = 50

/** 从文本中截取包含关键词的片段（去除部分 Markdown，限制长度） */
function extractSnippet(text: string | null | undefined, keyword: string): string | null {
  if (!text || !keyword) return null
  const lower = text.toLowerCase()
  const k = keyword.trim().toLowerCase()
  if (!k) return null
  const idx = lower.indexOf(k)
  if (idx === -1) return null
  const start = Math.max(0, idx - SNIPPET_CONTEXT)
  const end = Math.min(text.length, idx + k.length + SNIPPET_CONTEXT)
  let raw = text.slice(start, end)
  raw = raw
    .replace(/\s+/g, ' ')
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*\*?|__?/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  if (start > 0) raw = '…' + raw
  if (end < text.length) raw = raw + '…'
  raw = raw.trim()
  return raw.length > SNIPPET_MAX_LEN ? raw.slice(0, SNIPPET_MAX_LEN) + '…' : raw
}

/** 文章内容 base64 图片提取正则 */
const BASE64_IMAGE_REGEX = /!\[([^\]]*)\]\((data:image\/[^;]+;base64,[^)]+)\)/g
const BASE64_IMAGE_REGEX_ALT = /<img[^>]+src="(data:image\/[^;]+;base64,[^"]+)"[^>]*>/g
const UPLOAD_DIR = 'uploads'

/** HTML 实体转义 —— 防止邮件等 HTML 场景中的 XSS */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/* ========== 邮箱验证码缓存（内存） ========== */

/** 评论回复邮件通知频率限制：同一收件人 30 分钟内最多 1 封 */
const replyNotifyCooldownMap = new Map<string, number>()
const REPLY_NOTIFY_COOLDOWN_MS = 30 * 60 * 1000

// 定期清理过期条目
setInterval(() => {
  const now = Date.now()
  for (const [key, ts] of replyNotifyCooldownMap) {
    if (now - ts > REPLY_NOTIFY_COOLDOWN_MS) replyNotifyCooldownMap.delete(key)
  }
}, 5 * 60 * 1000)

interface VerifyCodeEntry {
  code: string
  expiresAt: number
}

/** 邮箱 → 验证码条目映射；TTL = appCfg.emailExpired (5 min)；上限 5000 条 */
const emailCodeCache = new Map<string, VerifyCodeEntry>()
const EMAIL_CODE_CACHE_MAX = 5000

/** 定期清理过期条目（每 60 秒） */
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of emailCodeCache) {
    if (entry.expiresAt <= now) emailCodeCache.delete(key)
  }
}, 60_000)

/* ========== CommonService 类 ========== */

class CommonService {

  /* ---------- 邮箱验证码 ---------- */

  /**
   * 发送邮箱验证码：生成 6 位随机数 → 写入缓存 → 通过 nodemailer 发送
   * 同一邮箱 60 秒内不可重复发送（防刷）
   */
  async sendEmailCode(req: Request, email: string, userRepo: Repository<Users>) {
    // 注册关闭时禁止发送验证码
    const { enabled, reason } = await this.isRegistrationEnabled(req)
    if (!enabled) {
      throw new Error(reason || '注册功能暂未开放，无法发送验证码')
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('邮箱格式不正确')
    }

    // 防刷：60 秒内已发送过
    const existing = emailCodeCache.get(email)
    if (existing && existing.expiresAt - appCfg.emailExpired + 60_000 > Date.now()) {
      throw new Error('验证码已发送，请 60 秒后再试')
    }

    // 检查邮箱是否已被注册
    const exist = await userRepo.findOne({ where: { email } })
    if (exist) {
      throw new Error('该邮箱已被注册')
    }

    // 生成 6 位验证码
    const code = String(Math.floor(100000 + Math.random() * 900000))

    // 写入缓存（超出上限则拒绝，防止内存耗尽攻击）
    if (emailCodeCache.size >= EMAIL_CODE_CACHE_MAX && !emailCodeCache.has(email)) {
      throw new Error('系统繁忙，请稍后再试')
    }
    emailCodeCache.set(email, {
      code,
      expiresAt: Date.now() + appCfg.emailExpired,
    })

    // 发送邮件
    const transporter = createTransporter()
    await sendMail(transporter, { to: email, code })

    return { message: '验证码已发送' }
  }

  /**
   * 校验邮箱验证码（注册时内部调用）
   * @returns true 已验证通过；会清除已使用的验证码
   */
  verifyEmailCode(email: string, code: string): boolean {
    const entry = emailCodeCache.get(email)
    if (!entry) return false
    if (Date.now() > entry.expiresAt) {
      emailCodeCache.delete(email)
      return false
    }
    if (entry.code !== code) return false
    // 验证通过后删除
    emailCodeCache.delete(email)
    return true
  }

  /* ---------- 认证相关 ---------- */

  /**
   * 检查注册功能是否开放
   * 读取全局设置 `registration_enabled`，默认关闭（个人博客备案场景）
   */
  async isRegistrationEnabled(req: Request): Promise<{ enabled: boolean; reason: string }> {
    const settingRepo = getDataSource(req).getRepository(Setting) as Repository<Setting>
    const row = await settingRepo.findOne({ where: { key: 'registration_enabled' } })
    // 未配置时默认关闭注册
    const enabled = row?.value === true || row?.value === 'true'
    const reason = enabled
      ? ''
      : (row?.desc || '当前为个人博客空间，暂不开放注册。如有需要请联系站长。')
    return { enabled, reason }
  }

  async register(
    req: Request,
    userRepo: Repository<Users>,
    data: IUserRegisterDto & { emailCode?: string },
    ret: number = 0,
  ) {
    // -1、检查注册是否开放
    const { enabled, reason } = await this.isRegistrationEnabled(req)
    if (!enabled) {
      throw new Error(reason || '注册功能暂未开放')
    }

    // 0、校验邮箱验证码
    if (!data.emailCode) {
      throw new Error('请输入邮箱验证码')
    }
    if (!this.verifyEmailCode(data.email, data.emailCode)) {
      throw new Error('验证码无效或已过期')
    }

    // 1、判断用户是否存在
    const exist = await userRepo.findOne({ where: [{ email: data.email }, { username: data.username }] })
    if (exist)
      throw new Error(`用户名或邮箱已被注册`)

    // 2、校验数据
    const errors = await validate(plainToInstance(Users, data))
    if (errors.length > 0)
      throw new Error(formatValidationErrors(errors))

    // 3、密码加密（使用 bcrypt 单向哈希，12 轮盐）
    const encryptedPassword = await bcrypt.hash(data.password, 12)

    // 4、生成刷新令牌的随机字符串密钥
    const rthash = getRandomString(32, 'hex')

    // 5、设置默认值（强制角色为普通用户，防止注册时提权）
    const userData = {
      ...data,
      password: encryptedPassword,
      role: CUserRole.USER,
      isActive: true,
      failLoginCount: 0,
      lastLoginAt: new Date(),
      rthash,
    }

    // 6、创建用户
    const user = userRepo.create(userData) as unknown as Users
    await userRepo.save(user)

    // 7、生成访问令牌
    const tokenPayload = { id: user.id, username: user.username, role: user.role }
    const token = sign(req, tokenPayload)

    // 8、生成刷新令牌
    const refreshToken = signRt(req, tokenPayload, rthash)

    // 9、更新用户的 token 字段
    user.token = token
    await userRepo.save(user)

    // 10、根据 ret 参数决定返回内容
    if (ret) {
      const {
        password, rthash: _,
        failLoginCount: _fc, lockoutExpiresAt: _la, lastLoginAt: _lla, isActive: _ia,
        ...userInfo
      } = user
      return { ...userInfo, token, rt: refreshToken }
    } else {
      return { id: user.id, token, rt: refreshToken }
    }
  }

  async login(
    req: Request,
    userRepo: Repository<Users>,
    data: { username: string; password: string },
  ) {
    // 1. 查询用户（username 可以是用户名或邮箱）
    const user = await userRepo.findOne({
      where: [{ username: data.username }, { email: data.username }],
      select: [
        'id', 'username', 'email', 'password', 'role', 'isActive',
        'rthash', 'failLoginCount', 'lockoutExpiresAt',
        'avatar', 'bio', 'namec', 'location', 'website', 'socials',
      ],
    })

    if (!user) throw new Error('用户不存在')

    // 2. 检查锁定状态
    if (user.lockoutExpiresAt && new Date(user.lockoutExpiresAt) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.lockoutExpiresAt).getTime() - Date.now()) / 60000)
      throw new Error(`账号已被锁定，请 ${remainingMinutes} 分钟后再试`)
    }

    // 3. 检查激活状态
    if (user.isActive === false) throw new Error('账号未激活')

    // 4. 验证密码 —— 兼容 bcrypt（新）和 AES（旧）两种格式
    const isBcryptHash = user.password.startsWith('$2')
    let passwordMatch = false

    if (isBcryptHash) {
      // bcrypt 哈希：直接比较
      passwordMatch = await bcrypt.compare(data.password, user.password)
    } else {
      // 旧版 AES 加密：解密后对比，成功则自动迁移为 bcrypt
      try {
        const decryptedPassword = decrypt(user.password)
        passwordMatch = decryptedPassword === data.password
      } catch {
        throw new Error('密码数据损坏，请联系管理员')
      }
    }

    if (!passwordMatch) {
      user.failLoginCount = (user.failLoginCount || 0) + 1
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

    // 5.1 自动将旧版 AES 密码迁移为 bcrypt 哈希
    if (!isBcryptHash) {
      user.password = await bcrypt.hash(data.password, 12)
    }

    // 6. 生成新的刷新令牌密钥
    const rthash = getRandomString(32, 'hex')
    user.rthash = rthash

    // 7. 生成访问令牌
    const tokenPayload = { id: user.id, username: user.username, role: user.role }
    const token = sign(req, tokenPayload)
    const refreshToken = signRt(req, tokenPayload, rthash)

    // 8. 更新用户的 token 字段
    user.token = token
    await userRepo.save(user)

    // 9. 返回用户信息（不包含敏感信息）
    const {
      password: _, rthash: __,
      failLoginCount: _fc, lockoutExpiresAt: _la, lastLoginAt: _lla, isActive: _ia,
      ...userInfo
    } = user
    return { ...userInfo, token, rt: refreshToken }
  }

  async refreshToken(req: Request, userRepo: Repository<Users>) {
    // 1. 从 Cookie 中获取刷新令牌
    const rt = req.cookies?.rt
    if (!rt) throw new Error('刷新令牌不存在，请重新登录')

    // 2. 解码刷新令牌获取用户信息
    const decoded = decode<{ id: number; username: string; role: string }>(rt)
    if (!decoded || !decoded.id) throw new Error('无效的刷新令牌')

    // 3. 查询用户
    const user = await userRepo.findOne({
      where: { id: decoded.id },
      select: [
        'id', 'username', 'email', 'role', 'isActive',
        'rthash', 'avatar', 'bio', 'namec', 'location', 'website', 'socials',
      ],
    })
    if (!user) throw new Error('用户不存在')
    if (user.isActive === false) throw new Error('账号未激活')
    if (!user.rthash) throw new Error('刷新令牌密钥不存在，请重新登录')

    // 4. 使用用户的 rthash 验证刷新令牌
    const verifyResult = verify(rt, user.rthash)
    if (!verifyResult.valid) throw new Error('刷新令牌无效或已过期，请重新登录')

    // 5. 生成新令牌
    const rthash = getRandomString(32, 'hex')
    user.rthash = rthash
    const tokenPayload = { id: user.id, username: user.username, role: user.role }
    const token = sign(req, tokenPayload)
    const newRt = signRt(req, tokenPayload, rthash)

    // 6. 更新用户的 token 字段
    user.token = token
    await userRepo.save(user)

    const {
      rthash: _, isActive: _ia,
      ...userInfo
    } = user
    return { ...userInfo, token, rt: newRt }
  }

  /**
   * 登出：清除用户的 token 和 rthash，使令牌失效
   */
  async logout(req: Request, userRepo: Repository<Users>) {
    if (!req.user?.id) throw new Error('未登录')
    await userRepo.update(req.user.id, { token: null, rthash: null })
  }

  /* ---------- 文件上传 / 媒体管理 ---------- */

  /**
   * 文件上传：保存到磁盘 + 写入 Media 表
   * @param req Express 请求（含 multer 处理后的 req.file）
   */
  async upload(req: Request): Promise<UploadResult> {
    const file = req.file
    if (!file) throw new Error('未接收到文件')

    const originalName = fixOriginalName(file.originalname)
    const ext = path.extname(originalName).replace('.', '')
    const hash = computeFileHash(file.path)
    const url = `/uploads/${file.filename}`
    const mediaType = resolveMediaType(file.mimetype)

    const ds = getDataSource(req)
    const mediaRepo = ds.getRepository(Media)
    const media = mediaRepo.create({
      name: file.filename,
      originalName,
      type: mediaType,
      mineType: file.mimetype,
      url,
      ext: ext || 'unknown',
      size: file.size,
      hash,
    })
    const saved = await mediaRepo.save(media)

    return {
      url,
      mediaId: saved.id,
      name: originalName,
      size: file.size,
      mimeType: file.mimetype,
    }
  }

  /**
   * 删除媒体：删除 Media 记录 + 物理文件
   */
  async deleteMedia(req: Request, id: number): Promise<void> {
    const ds = getDataSource(req)
    const mediaRepo = ds.getRepository(Media)
    const media = await mediaRepo.findOne({ where: { id } })
    if (!media) throw new Error('媒体记录不存在')

    if (media.url) {
      const filePath = path.join(appCfg.staticPath, media.url)
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      } catch { /* 物理文件删除失败不影响记录删除 */ }
    }

    await mediaRepo.delete(id)
  }

  /* ---------- 文章内容处理 ---------- */

  /**
   * 从 markdown 内容中提取 base64 图片，写入静态目录，并替换为相对 URL
   */
  processArticleContent(content: string): string {
    const uploadDir = path.join(appCfg.staticPath, UPLOAD_DIR)
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    let result = content

    const replaceBase64 = (match: string, alt: string, dataUrl: string): string => {
      const m = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/)
      if (!m) return match
      const ext = m[1] === 'jpeg' ? 'jpg' : m[1]
      const base64Data = m[2]
      const buffer = Buffer.from(base64Data, 'base64')
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`
      const filepath = path.join(uploadDir, filename)
      fs.writeFileSync(filepath, buffer)
      return `![${alt}](/${UPLOAD_DIR}/${filename})`
    }

    result = result.replace(BASE64_IMAGE_REGEX, replaceBase64)
    result = result.replace(BASE64_IMAGE_REGEX_ALT, (match) => {
      const m = match.match(/src="(data:image\/[^;]+;base64,[^"]+)"/)
      if (!m) return match
      const [, dataUrl] = m
      const m2 = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/)
      if (!m2) return match
      const ext = m2[1] === 'jpeg' ? 'jpg' : m2[1]
      const buffer = Buffer.from(m2[2], 'base64')
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`
      const filepath = path.join(uploadDir, filename)
      fs.writeFileSync(filepath, buffer)
      return match.replace(dataUrl, `/${UPLOAD_DIR}/${filename}`)
    })

    return result
  }

  /* ---------- 文章搜索 ---------- */

  /**
   * 文章全文搜索：对标题、正文、描述进行 ILIKE 匹配，仅返回已发布文章
   * @param req     请求（用于取 DataSource）
   * @param keyword 关键词，会做前后 % 模糊匹配
   * @param scope   搜索范围，默认 all
   * @param limit   返回条数，默认 20
   */
  async searchArticles(
    req: Request,
    keyword: string,
    scope: SearchScope = 'all',
    limit: number = DEFAULT_SEARCH_LIMIT,
  ): Promise<ArticleSearchItem[]> {
    const k = (keyword ?? '').trim()
    if (!k) return []

    const ds = getDataSource(req)
    const repo = ds.getRepository(Article)
    const pattern = `%${k}%`

    const qb = repo
      .createQueryBuilder('a')
      .select(['a.id', 'a.title', 'a.desc', 'a.content', 'a.publishedAt'])
      .where('a.status = :status', { status: CArticleStatus.PUBLISHED })

    switch (scope) {
      case 'title':
        qb.andWhere('a.title ILIKE :pattern', { pattern }); break
      case 'content':
        qb.andWhere('a.content ILIKE :pattern', { pattern }); break
      case 'desc':
        qb.andWhere('a.desc ILIKE :pattern', { pattern }); break
      default:
        qb.andWhere(
          '(a.title ILIKE :pattern OR a.content ILIKE :pattern OR (a.desc IS NOT NULL AND a.desc ILIKE :pattern))',
          { pattern },
        )
    }

    qb.orderBy('CASE WHEN a.title ILIKE :pattern THEN 0 ELSE 1 END', 'ASC')
    qb.addOrderBy('a.publishedAt', 'DESC')
    qb.take(Math.min(limit, 50))

    const rows = await qb.getMany()

    return rows.map((a) => {
      let snippet: string | null = null
      if (scope === 'content' || scope === 'all') snippet = extractSnippet(a.content, k)
      if (snippet == null && (scope === 'desc' || scope === 'all') && a.desc) snippet = extractSnippet(a.desc, k)
      if (snippet == null && (scope === 'title' || scope === 'all')) {
        if ((a.title ?? '').toLowerCase().includes(k.toLowerCase())) snippet = a.title ?? null
      }
      return {
        id: a.id,
        title: a.title ?? '',
        desc: a.desc ?? null,
        publishedAt: a.publishedAt instanceof Date ? a.publishedAt.toISOString() : String(a.publishedAt),
        snippet,
      }
    })
  }

  /* ---------- 词云权重 ---------- */

  /**
   * 分析类别与标签的权重（文章数）与声噪（归一化权重），供前端词云等可视化使用
   * 仅统计已发布文章
   */
  async getCloudWeights(req: Request): Promise<CloudWeightsData> {
    const ds = getDataSource(req)
    const articleRepo = ds.getRepository(Article)
    const categoryRepo = ds.getRepository(Category)
    const tagRepo = ds.getRepository(Tag)

    const publishedStatus = CArticleStatus.PUBLISHED

    const [categories, tagCounts] = await Promise.all([
      categoryRepo.find({ select: ['id', 'name', 'desc'], order: { id: 'ASC' } }),
      articleRepo
        .createQueryBuilder('a')
        .innerJoin('a.tags', 't')
        .select('t.id', 'tagId')
        .addSelect('COUNT(DISTINCT a.id)', 'cnt')
        .where('a.status = :status', { status: publishedStatus })
        .groupBy('t.id')
        .getRawMany<{ tagId: number; cnt: string }>(),
    ])

    const categoryCounts = await articleRepo
      .createQueryBuilder('a')
      .select('a.categoryId', 'categoryId')
      .addSelect('COUNT(a.id)', 'cnt')
      .where('a.status = :status', { status: publishedStatus })
      .andWhere('a.categoryId IS NOT NULL')
      .groupBy('a.categoryId')
      .getRawMany<{ categoryId: number; cnt: string }>()

    const catCountMap = new Map(categoryCounts.map(r => [r.categoryId, Number(r.cnt)]))
    const tagCountMap = new Map(tagCounts.map(r => [r.tagId, Number(r.cnt)]))

    const catWeights = categories.map(c => ({
      id: c.id, name: c.name, desc: c.desc ?? null,
      weight: catCountMap.get(c.id) ?? 0, signalNoise: 0,
    }))

    const tagList = await tagRepo.find({ select: ['id', 'name', 'color'], order: { id: 'ASC' } })
    const tagWeights = tagList.map(t => ({
      id: t.id, name: t.name, color: t.color ?? null,
      weight: tagCountMap.get(t.id) ?? 0, signalNoise: 0,
    }))

    // 归一化权重
    const allWeights = [...catWeights.map(x => x.weight), ...tagWeights.map(x => x.weight)].filter(w => w > 0)
    const maxW = allWeights.length ? Math.max(...allWeights) : 1
    const normalize = (w: number) => maxW <= 0 ? 0 : Math.min(1, w / maxW)

    catWeights.forEach(item => { item.signalNoise = normalize(item.weight) })
    tagWeights.forEach(item => { item.signalNoise = normalize(item.weight) })

    return { categories: catWeights, tags: tagWeights }
  }

  /* ---------- 网站概览统计 ---------- */

  /**
   * 网站概览统计：文章/分类/标签数量、浏览/点赞/评论汇总、运行天数、最后更新
   * 仅统计已发布文章
   */
  async getSiteOverview(req: Request): Promise<SiteOverviewData> {
    const ds = getDataSource(req)
    const articleRepo = ds.getRepository(Article)
    const categoryRepo = ds.getRepository(Category)
    const tagRepo = ds.getRepository(Tag)

    const [articleCount, categoryCount, tagCount] = await Promise.all([
      articleRepo.count({ where: { status: CArticleStatus.PUBLISHED } }),
      categoryRepo.count(),
      tagRepo.count(),
    ])

    /* 统计独立访客数（按 IP 去重） */
    const viewRepo = ds.getRepository(View)
    const uvResult = await viewRepo
      .createQueryBuilder('v')
      .select('COUNT(DISTINCT v.ip)', 'totalUv')
      .getRawOne<{ totalUv: string }>()
    const totalUniqueVisitors = Number(uvResult?.totalUv ?? 0)

    const agg = await articleRepo
      .createQueryBuilder('a')
      .select('COALESCE(SUM(a.viewCount), 0)', 'totalViews')
      .addSelect('COALESCE(SUM(a.likeCount), 0)', 'totalLikes')
      .addSelect('COALESCE(SUM(a.commentCount), 0)', 'totalComments')
      .addSelect('MIN(a.createdAt)', 'earliestCreated')
      .addSelect('MAX(a.updatedAt)', 'latestUpdated')
      .where('a.status = :status', { status: CArticleStatus.PUBLISHED })
      .getRawOne<{
        totalViews: string
        totalLikes: string
        totalComments: string
        earliestCreated: Date | null
        latestUpdated: Date | null
      }>()

    const totalViews = Number(agg?.totalViews ?? 0)
    const totalLikes = Number(agg?.totalLikes ?? 0)
    const totalComments = Number(agg?.totalComments ?? 0)
    const latestUpdated = agg?.latestUpdated ? new Date(agg.latestUpdated) : null

    // 网站上线日期（固定值），用于计算运行天数
    const SITE_LAUNCH_DATE = new Date('2026-02-23T00:00:00+08:00')
    const runningDays = Math.max(1, Math.floor((Date.now() - SITE_LAUNCH_DATE.getTime()) / 86400000))

    let lastUpdate = '--'
    if (latestUpdated) {
      const d = latestUpdated
      lastUpdate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }

    return { articleCount, categoryCount, tagCount, totalViews, totalUniqueVisitors, totalLikes, totalComments, runningDays, lastUpdate }
  }

  /* ---------- 浏览量统计 ---------- */

  /** 同一 IP 对同一文章的去重时间窗口（10 分钟） */
  private static ARTICLE_VIEW_DEDUP_MS = 10 * 60 * 1000

  /** 同一 IP 站点访问的去重时间窗口（1 天） */
  private static SITE_VISIT_DEDUP_MS = 24 * 60 * 60 * 1000

  /**
   * 记录文章浏览：去重窗口内同一 IP 不重复计数
   * @returns 更新后的 viewCount
   */
  async recordArticleView(
    req: Request,
    articleId: number,
    ip: string | undefined,
    agent: string | undefined,
  ): Promise<{ viewCount: number }> {
    const ds = getDataSource(req)
    const articleRepo = ds.getRepository(Article)
    const viewRepo = ds.getRepository(View)

    // 校验文章存在
    const article = await articleRepo.findOne({ where: { id: articleId, status: CArticleStatus.PUBLISHED } })
    if (!article) throw new Error('文章不存在或未发布')

    // 去重：同一 IP + 同一文章在窗口期内不重复计数
    let shouldCount = true
    if (ip) {
      const since = new Date(Date.now() - CommonService.ARTICLE_VIEW_DEDUP_MS)
      const existing = await viewRepo
        .createQueryBuilder('v')
        .where('v.ip = :ip', { ip })
        .andWhere('v.articleId = :articleId', { articleId })
        .andWhere('v.createdAt > :since', { since })
        .orderBy('v.createdAt', 'DESC')
        .getOne()
      if (existing) shouldCount = false
    }

    // 写入 View 记录（无论是否去重，便于后续分析）
    const view = viewRepo.create({
      ip: ip ?? null,
      agent: agent ?? null,
      articleId,
    })
    await viewRepo.save(view)

    // 去重通过时，递增文章 viewCount
    if (shouldCount) {
      await articleRepo.increment({ id: articleId }, 'viewCount', 1)
    }

    // 返回最新的 viewCount
    const updated = await articleRepo.findOne({ where: { id: articleId }, select: ['id', 'viewCount'] })
    return { viewCount: updated?.viewCount ?? article.viewCount + (shouldCount ? 1 : 0) }
  }

  /**
   * 记录站点访问：同一 IP 一天内不重复计数
   * 返回今日 UV（唯一 IP 数）
   */
  async recordSiteVisit(
    req: Request,
    ip: string | undefined,
    agent: string | undefined,
  ): Promise<{ todayUv: number }> {
    const ds = getDataSource(req)
    const viewRepo = ds.getRepository(View)

    // 去重：同一 IP 在一天窗口内不重复记录
    let isDuplicate = false
    if (ip) {
      const since = new Date(Date.now() - CommonService.SITE_VISIT_DEDUP_MS)
      const existing = await viewRepo
        .createQueryBuilder('v')
        .where('v.ip = :ip', { ip })
        .andWhere('v.articleId IS NULL')
        .andWhere('v.createdAt > :since', { since })
        .getOne()
      if (existing) isDuplicate = true
    }

    if (!isDuplicate) {
      const view = viewRepo.create({
        ip: ip ?? null,
        agent: agent ?? null,
      })
      await viewRepo.save(view)
    }

    // 查询今日 UV（articleId IS NULL 的独立 IP 数）
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const { uv } = await viewRepo
      .createQueryBuilder('v')
      .select('COUNT(DISTINCT v.ip)', 'uv')
      .where('v.articleId IS NULL')
      .andWhere('v.createdAt >= :todayStart', { todayStart })
      .getRawOne<{ uv: string }>() ?? { uv: '0' }
    return { todayUv: Number(uv) }
  }

  /* ---------- 文章点赞 ---------- */

  /** 同一 IP / 指纹对同一文章的去重时间窗口（24 小时） */
  private static LIKE_DEDUP_MS = 24 * 60 * 60 * 1000

  /**
   * 切换文章点赞状态
   * - 登录用户：DB 精确去重（userId + articleId）
   * - 游客：IP + fingerprint 去重（24 小时窗口）
   * @returns { liked, likeCount }
   */
  async toggleArticleLike(
    req: Request,
    articleId: number,
    ip: string | undefined,
    fingerprint: string | undefined,
  ): Promise<{ liked: boolean; likeCount: number }> {
    const ds = getDataSource(req)
    const articleRepo = ds.getRepository(Article)
    const likeRepo = ds.getRepository(Likes)
    const userId = req.user?.id ?? null

    // 校验文章存在
    const article = await articleRepo.findOne({ where: { id: articleId, status: CArticleStatus.PUBLISHED } })
    if (!article) throw new Error('文章不存在或未发布')

    let existing: Likes | null = null

    if (userId) {
      // 登录用户：通过 userId + articleId 精确查重
      existing = await likeRepo.findOne({ where: { userId, articleId } })
    } else if (ip || fingerprint) {
      // 游客：通过 IP + fingerprint + 时间窗口查重
      const qb = likeRepo.createQueryBuilder('l')
        .where('l.articleId = :articleId', { articleId })
        .andWhere('l.userId IS NULL')
      if (ip) qb.andWhere('l.ip = :ip', { ip })
      if (fingerprint) qb.andWhere('l.fingerprint = :fingerprint', { fingerprint })
      const since = new Date(Date.now() - CommonService.LIKE_DEDUP_MS)
      qb.andWhere('l.createdAt > :since', { since })
      existing = await qb.getOne()
    }

    if (existing) {
      // 已点赞 → 取消
      await likeRepo.remove(existing)
      await articleRepo.decrement({ id: articleId }, 'likeCount', 1)
      const updated = await articleRepo.findOne({ where: { id: articleId }, select: ['id', 'likeCount'] })
      return { liked: false, likeCount: Math.max(0, updated?.likeCount ?? 0) }
    } else {
      // 未点赞 → 新增
      const like = likeRepo.create({
        userId: userId ?? undefined,
        articleId,
        ip: ip ?? null,
        fingerprint: fingerprint ?? null,
      })
      await likeRepo.save(like)
      await articleRepo.increment({ id: articleId }, 'likeCount', 1)
      const updated = await articleRepo.findOne({ where: { id: articleId }, select: ['id', 'likeCount'] })
      return { liked: true, likeCount: updated?.likeCount ?? (article.likeCount + 1) }
    }
  }

  /**
   * 查询当前用户/游客是否已对指定文章点赞
   */
  async getArticleLikeStatus(
    req: Request,
    articleId: number,
    ip: string | undefined,
    fingerprint: string | undefined,
  ): Promise<{ liked: boolean }> {
    const ds = getDataSource(req)
    const likeRepo = ds.getRepository(Likes)
    const userId = req.user?.id ?? null

    let existing: Likes | null = null

    if (userId) {
      existing = await likeRepo.findOne({ where: { userId, articleId } })
    } else if (ip || fingerprint) {
      const qb = likeRepo.createQueryBuilder('l')
        .where('l.articleId = :articleId', { articleId })
        .andWhere('l.userId IS NULL')
      if (ip) qb.andWhere('l.ip = :ip', { ip })
      if (fingerprint) qb.andWhere('l.fingerprint = :fingerprint', { fingerprint })
      const since = new Date(Date.now() - CommonService.LIKE_DEDUP_MS)
      qb.andWhere('l.createdAt > :since', { since })
      existing = await qb.getOne()
    }

    return { liked: !!existing }
  }

  /* ---------- 系统设置 ---------- */

  /**
   * 按 key 列表查询设置，返回 key -> { value, desc?, masked? }
   * 不传 keys 时返回全部
   * 对 USER_SCOPED_KEYS 中的 key：已认证时优先读取 user_setting 表
   */
  async getSettings(
    req: Request,
    keys?: string[],
  ): Promise<Record<string, { value: unknown; desc?: string | null; masked?: boolean }>> {
    const userId = req.user?.id
    const out: Record<string, { value: unknown; desc?: string | null; masked?: boolean }> = {}

    // 空数组快速返回
    if (keys && keys.length === 0) return out

    // 分离用户级 key 和全局 key
    const userKeys = keys?.filter(k => USER_SCOPED_KEYS.has(k)) ?? []
    const globalKeys = keys?.filter(k => !USER_SCOPED_KEYS.has(k))

    // 1. 查询全局 Setting 表 —— 仅查非用户级 key，用户级 key 不走全局 fallback
    const settingRepo = getDataSource(req).getRepository(Setting) as Repository<Setting>
    const globalQb = settingRepo.createQueryBuilder('s')
    if (keys && keys.length > 0) {
      // 只查全局部分（排除用户级 key，避免全局 fallback 导致数据泄漏）
      if (globalKeys && globalKeys.length > 0) {
        globalQb.andWhere('s.key IN (:...keys)', { keys: globalKeys })
      } else {
        // 请求的 key 全是用户级的，跳过全局查询
        globalQb.andWhere('1 = 0')
      }
    } else if (!keys) {
      // 未指定 keys：查全部非用户级 key
      globalQb.andWhere('s.key NOT IN (:...scopedKeys)', { scopedKeys: [...USER_SCOPED_KEYS] })
    }
    const globalList = await globalQb.getMany()
    for (const row of globalList) {
      let val = row.value
      if (CommonService.ENCRYPT_KEYS.has(row.key) && typeof val === 'string' && val.includes(':')) {
        try { val = decrypt(val) } catch { /* 兼容旧数据 */ }
      }
      const masked = MASK_KEYS.has(row.key)
      out[row.key] = {
        value: masked ? maskValue(val) : val,
        desc: row.desc ?? undefined,
        masked: masked ? true : undefined,
      }
    }

    // 2. 从 user_setting 表读取用户级 key
    // 已登录 → 读当前用户的设置；未登录 → 回退读 super_admin 用户的设置（访客看站长信息）
    const targetUserId = userId ?? await this.getSuperAdminId(req)
    if (targetUserId) {
      const userSettingRepo = getDataSource(req).getRepository(UserSetting) as Repository<UserSetting>
      const usQb = userSettingRepo.createQueryBuilder('us')
        .where('us.userId = :userId', { userId: targetUserId })
      // 如果指定了 keys，只查用户级部分
      if (userKeys.length > 0) {
        usQb.andWhere('us.key IN (:...keys)', { keys: userKeys })
      } else if (!keys) {
        // 未指定 keys 时查全部用户级设置
        usQb.andWhere('us.key IN (:...scopedKeys)', { scopedKeys: [...USER_SCOPED_KEYS] })
      }
      const userList = await usQb.getMany()
      for (const row of userList) {
        let val = row.value
        if (CommonService.ENCRYPT_KEYS.has(row.key) && typeof val === 'string' && val.includes(':')) {
          try { val = decrypt(val) } catch { /* 兼容旧数据 */ }
        }
        const masked = MASK_KEYS.has(row.key)
        out[row.key] = {
          value: masked ? maskValue(val) : val,
          desc: row.desc ?? undefined,
          masked: masked ? true : undefined,
        }
      }
    }

    return out
  }

  /** 需要加密存储的 key（写入时加密，读取时解密） */
  private static readonly ENCRYPT_KEYS = new Set(['openai_api_key'])

  /** 缓存 super_admin 用户 ID（undefined 表示未缓存，null 表示查库后不存在） */
  private _superAdminId: number | null | undefined = undefined

  /** 获取 super_admin 用户 ID（访客 fallback 时使用） */
  private async getSuperAdminId(req: Request): Promise<number | null> {
    if (this._superAdminId !== undefined) return this._superAdminId
    const userRepo = getDataSource(req).getRepository(Users) as Repository<Users>
    const admin = await userRepo.findOne({
      where: { role: CUserRole.SUPER_ADMIN },
      select: ['id'],
      order: { id: 'ASC' },
    })
    this._superAdminId = admin?.id ?? null
    return this._superAdminId
  }

  /**
   * 批量 upsert 设置（按 key 存在则更新，否则插入）
   * openai_api_key 等敏感字段会使用 AES 加密后存储
   * 用户级 key（USER_SCOPED_KEYS）写入 user_setting 表，其余写入 setting 表
   */
  async setSettings(
    req: Request,
    record: Record<string, { value: unknown; desc?: string }>,
  ): Promise<void> {
    const userId = req.user?.id
    const settingRepo = getDataSource(req).getRepository(Setting) as Repository<Setting>
    const userSettingRepo = userId
      ? getDataSource(req).getRepository(UserSetting) as Repository<UserSetting>
      : null

    for (const [key, { value, desc }] of Object.entries(record)) {
      // 防御：跳过无效 key（如 "undefined"、空字符串等前端传参异常）
      if (!key || key === 'undefined' || key === 'null') continue
      // 1. 传输层解密（前端通过 AES-GCM 加密后格式: __enc__:iv:ciphertext）
      let plainValue: unknown = value
      if (typeof value === 'string' && value.startsWith('__enc__:')) {
        plainValue = decryptTransport(value)
      }
      // 2. 存储层加密（AES-256-CBC）
      const finalValue = CommonService.ENCRYPT_KEYS.has(key) && typeof plainValue === 'string' && (plainValue as string).trim()
        ? encrypt((plainValue as string).trim())
        : plainValue

      // 用户级 key 且已认证 → 写入 user_setting 表
      if (USER_SCOPED_KEYS.has(key) && userId && userSettingRepo) {
        const existing = await userSettingRepo.findOne({ where: { userId, key } })
        if (existing) {
          existing.value = finalValue
          if (desc !== undefined) existing.desc = desc
          await userSettingRepo.save(existing)
        } else {
          const entity = userSettingRepo.create({ userId, key, value: finalValue, desc: desc ?? null })
          await userSettingRepo.save(entity)
        }
      } else {
        // 全局 key → 写入 setting 表
        const existing = await settingRepo.findOne({ where: { key } })
        if (existing) {
          existing.value = finalValue
          if (desc !== undefined) existing.desc = desc
          await settingRepo.save(existing)
        } else {
          const entity = settingRepo.create({ key, value: finalValue, desc: desc ?? null })
          await settingRepo.save(entity)
        }
      }
    }
  }

  /* ---------- 评论回复邮件通知 ---------- */

  /**
   * 当有人回复评论时，异步发送邮件通知被回复者
   * - 注册用户：从 Users 表获取 email
   * - 游客：使用 Comment.email 字段
   * - 同一收件人 30 分钟内最多 1 封（防骚扰）
   * - 不回复自己
   */
  async sendCommentReplyNotification(
    req: Request,
    parentCommentId: number,
    replyComment: { content: string; nickname?: string | null; userId?: number | null },
    articleId?: number | null,
  ): Promise<void> {
    try {
      const ds = getDataSource(req)
      const commentRepo = ds.getRepository(Comment)
      const userRepo = ds.getRepository(Users)

      // 查询父评论
      const parent = await commentRepo.findOne({
        where: { id: parentCommentId },
        select: ['id', 'userId', 'email', 'nickname', 'content', 'articleId'],
      })
      if (!parent) return

      // 获取被回复者邮箱
      let recipientEmail: string | null = null
      let recipientName: string = '用户'
      if (parent.userId) {
        const parentUser = await userRepo.findOne({
          where: { id: parent.userId },
          select: ['id', 'email', 'namec', 'username'],
        })
        if (parentUser?.email) {
          recipientEmail = parentUser.email
          recipientName = parentUser.namec || parentUser.username || '用户'
        }
      } else if (parent.email) {
        recipientEmail = parent.email
        recipientName = parent.nickname || '访客'
      }

      if (!recipientEmail) return

      // 不给自己发通知
      if (replyComment.userId && parent.userId && replyComment.userId === parent.userId) return

      // 频率限制：同一收件人 30 分钟冷却
      const lastSent = replyNotifyCooldownMap.get(recipientEmail)
      if (lastSent && Date.now() - lastSent < REPLY_NOTIFY_COOLDOWN_MS) return
      replyNotifyCooldownMap.set(recipientEmail, Date.now())

      // 获取回复者名称
      let replierName = replyComment.nickname || '匿名用户'
      if (replyComment.userId) {
        const replier = await userRepo.findOne({
          where: { id: replyComment.userId },
          select: ['id', 'namec', 'username'],
        })
        if (replier) replierName = replier.namec || replier.username || '用户'
      }

      // 获取文章标题（如果有关联文章）
      const realArticleId = articleId ?? parent.articleId
      let articleTitle = ''
      if (realArticleId) {
        const article = await ds.getRepository(Article).findOne({
          where: { id: realArticleId },
          select: ['id', 'title'],
        })
        if (article) articleTitle = article.title || ''
      }

      // 站点 URL（从环境变量获取，默认本地开发地址）
      const siteUrl = process.env.SITE_URL || 'http://localhost:5173'
      const articleLink = realArticleId ? `${siteUrl}/read/${realArticleId}` : siteUrl

      // 截断评论内容，防止邮件过长
      const truncate = (text: string, max: number) =>
        text.length > max ? text.slice(0, max) + '…' : text
      const parentSnippet = escapeHtml(truncate(parent.content.replace(/<[^>]*>/g, ''), 100))
      const replySnippet = escapeHtml(truncate(replyComment.content.replace(/<[^>]*>/g, ''), 200))

      // HTML 转义用户输入，防止邮件 XSS
      const safeRecipientName = escapeHtml(recipientName)
      const safeReplierName = escapeHtml(replierName)
      const safeArticleTitle = escapeHtml(articleTitle)

      // 构建 HTML 邮件
      const html = `
        <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;">
          <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:24px 32px;border-radius:8px 8px 0 0;">
            <h2 style="margin:0;color:#fff;font-size:20px;">💬 您收到了一条新回复</h2>
          </div>
          <div style="background:#fff;padding:24px 32px;border:1px solid #e8e8e8;border-top:none;border-radius:0 0 8px 8px;">
            <p style="margin:0 0 16px;color:#555;">Hi <strong>${safeRecipientName}</strong>，</p>
            <p style="margin:0 0 12px;color:#555;">
              <strong>${safeReplierName}</strong> 回复了您${safeArticleTitle ? `在《${safeArticleTitle}》中` : ''}的评论：
            </p>
            <div style="background:#f5f5f5;border-left:4px solid #ddd;padding:12px 16px;margin:0 0 12px;border-radius:4px;color:#888;font-size:14px;">
              ${parentSnippet}
            </div>
            <div style="background:#f0f7ff;border-left:4px solid #667eea;padding:12px 16px;margin:0 0 20px;border-radius:4px;font-size:14px;">
              ${replySnippet}
            </div>
            <a href="${articleLink}" style="display:inline-block;background:#667eea;color:#fff;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:14px;">
              查看详情
            </a>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0 12px;" />
            <p style="margin:0;font-size:12px;color:#aaa;">
              此邮件由 Ucc Blog 系统自动发送，同一邮箱 30 分钟内最多收到 1 封通知。
            </p>
          </div>
        </div>
      `

      const transporter = createTransporter()
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: `[Ucc Blog] ${safeReplierName} 回复了您的评论${safeArticleTitle ? ` — ${safeArticleTitle}` : ''}`,
        html,
      })
    } catch (err) {
      // 邮件发送失败不阻塞主流程，仅打印日志
      console.error('[CommentReplyNotify] 发送邮件通知失败:', err)
    }
  }

  /* ---------- 友情链接 ---------- */

  /** 查询已审核通过的友链列表（公开接口，按 sortOrder DESC + createdAt DESC） */
  async getFriendLinks(req: Request, userId: number): Promise<FriendLink[]> {
    const ds = getDataSource(req)
    const repo = ds.getRepository(FriendLink)
    return repo.find({
      where: { userId, status: CFriendLinkStatus.APPROVED },
      order: { sortOrder: 'DESC', createdAt: 'DESC' } as any,
    })
  }

  /** 查询某用户的全部友链（博主管理用，含待审核/已拒绝） */
  async getAllFriendLinks(req: Request, userId: number): Promise<FriendLink[]> {
    const ds = getDataSource(req)
    const repo = ds.getRepository(FriendLink)
    return repo.find({
      where: { userId },
      order: { status: 'ASC', sortOrder: 'DESC', createdAt: 'DESC' } as any,
    })
  }

  /** 提交友链申请（访客可用） */
  async submitFriendLink(
    req: Request,
    data: { userId: number; url: string; title: string; icon?: string; description?: string; email?: string },
  ): Promise<FriendLink> {
    const ds = getDataSource(req)
    const repo = ds.getRepository(FriendLink)
    // 检查重复 URL
    const existing = await repo.findOne({ where: { userId: data.userId, url: data.url } })
    if (existing) throw new Error('该链接已存在，请勿重复提交')
    const entity = repo.create({
      ...data,
      status: CFriendLinkStatus.PENDING,
      sortOrder: 0,
    })
    const saved = await repo.save(entity)
    // 异步通知博主
    this.notifyFriendLinkSubmission(req, data.userId, saved).catch(() => {})
    return saved
  }

  /** 审核友链（通过/拒绝） */
  async reviewFriendLink(
    req: Request,
    linkId: number,
    ownerId: number,
    action: 'approve' | 'reject',
  ): Promise<FriendLink> {
    const ds = getDataSource(req)
    const repo = ds.getRepository(FriendLink)
    const link = await repo.findOne({ where: { id: linkId, userId: ownerId } })
    if (!link) throw new Error('友链不存在或无权操作')
    link.status = action === 'approve' ? CFriendLinkStatus.APPROVED : CFriendLinkStatus.REJECTED
    return repo.save(link)
  }

  /** 更新友链排序权重 */
  async updateFriendLinkSort(req: Request, linkId: number, ownerId: number, sortOrder: number): Promise<FriendLink> {
    const ds = getDataSource(req)
    const repo = ds.getRepository(FriendLink)
    const link = await repo.findOne({ where: { id: linkId, userId: ownerId } })
    if (!link) throw new Error('友链不存在或无权操作')
    link.sortOrder = sortOrder
    return repo.save(link)
  }

  /** 删除友链 */
  async deleteFriendLink(req: Request, linkId: number, ownerId: number): Promise<void> {
    const ds = getDataSource(req)
    const repo = ds.getRepository(FriendLink)
    const link = await repo.findOne({ where: { id: linkId, userId: ownerId } })
    if (!link) throw new Error('友链不存在或无权操作')
    await repo.remove(link)
  }

  /** 友链申请邮件通知博主 */
  private async notifyFriendLinkSubmission(req: Request, blogOwnerId: number, link: FriendLink): Promise<void> {
    try {
      // 检查博主是否开启了友链通知
      const ds = getDataSource(req)
      const userSettingRepo = ds.getRepository(UserSetting)
      const notifySetting = await userSettingRepo.findOne({
        where: { userId: blogOwnerId, key: 'friend_link_notify' },
      })
      // 默认开启通知，设为 'false' 时关闭
      if (notifySetting?.value === 'false' || notifySetting?.value === false) return

      // 获取博主邮箱
      const userRepo = ds.getRepository(Users)
      const owner = await userRepo.findOne({ where: { id: blogOwnerId }, select: ['id', 'email', 'namec', 'username'] })
      if (!owner?.email) return

      const siteUrl = process.env.SITE_URL || 'http://localhost:5173'
      const html = `
        <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;">
          <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:24px 32px;border-radius:8px 8px 0 0;">
            <h2 style="margin:0;color:#fff;font-size:20px;">🔗 新的友链申请</h2>
          </div>
          <div style="background:#fff;padding:24px 32px;border:1px solid #e8e8e8;border-top:none;border-radius:0 0 8px 8px;">
            <p style="margin:0 0 16px;color:#555;">Hi <strong>${owner.namec || owner.username}</strong>，</p>
            <p style="margin:0 0 12px;color:#555;">您收到了一个新的友链申请：</p>
            <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:0 0 16px;">
              <p style="margin:0 0 8px;"><strong>标题：</strong>${link.title}</p>
              <p style="margin:0 0 8px;"><strong>URL：</strong><a href="${link.url}" style="color:#667eea;">${link.url}</a></p>
              ${link.description ? `<p style="margin:0 0 8px;"><strong>简介：</strong>${link.description}</p>` : ''}
              ${link.email ? `<p style="margin:0;"><strong>邮箱：</strong>${link.email}</p>` : ''}
            </div>
            <a href="${siteUrl}/setting" style="display:inline-block;background:#667eea;color:#fff;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:14px;">
              前往审核
            </a>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0 12px;" />
            <p style="margin:0;font-size:12px;color:#aaa;">此邮件由 Ucc Blog 系统自动发送。</p>
          </div>
        </div>
      `
      const transporter = createTransporter()
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: owner.email,
        subject: `[Ucc Blog] 新的友链申请 — ${link.title}`,
        html,
      })
    } catch (err) {
      console.error('[FriendLinkNotify] 发送邮件通知失败:', err)
    }
  }

  /* ---------- 用户博客公开资料 ---------- */

  /** 根据用户名获取用户公开博客信息（含个人设置 + 文章统计） */
  async getUserBlogProfile(req: Request, username: string): Promise<{
    user: Partial<IUser>
    settings: Record<string, unknown>
    stats: { articleCount: number; totalViews: number; totalLikes: number }
  }> {
    const ds = getDataSource(req)
    const userRepo = ds.getRepository(Users)
    const user = await userRepo.findOne({
      where: { username },
      select: ['id', 'username', 'namec', 'avatar', 'bio', 'role', 'gender', 'location', 'website', 'socials', 'createdAt'] as any,
    })
    if (!user) throw new Error('用户不存在')

    // 获取用户个人设置（站点信息 + 可见路由）
    const userSettingRepo = ds.getRepository(UserSetting)
    const publicKeys = ['site_name', 'site_description', 'site_keywords', 'site_favicon', 'visible_routes', 'blog_theme', 'blog_share_mode']
    const userSettings = await userSettingRepo.find({
      where: { userId: user.id },
    })
    const settings: Record<string, unknown> = {}
    for (const row of userSettings) {
      if (publicKeys.includes(row.key)) {
        settings[row.key] = row.value
      }
    }

    // 文章统计
    const articleRepo = ds.getRepository(Article)
    const statsRaw = await articleRepo
      .createQueryBuilder('a')
      .select('COUNT(a.id)', 'articleCount')
      .addSelect('COALESCE(SUM(a.viewCount), 0)', 'totalViews')
      .addSelect('COALESCE(SUM(a.likeCount), 0)', 'totalLikes')
      .where('a.userId = :userId', { userId: user.id })
      .andWhere('a.status = :status', { status: CArticleStatus.PUBLISHED })
      .getRawOne()

    return {
      user: {
        id: user.id,
        username: user.username,
        namec: user.namec,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        gender: user.gender,
        location: user.location,
        website: user.website as any,
        socials: user.socials as any,
        createdAt: (user as any).createdAt,
      },
      settings,
      stats: {
        articleCount: parseInt(statsRaw?.articleCount ?? '0', 10),
        totalViews: parseInt(statsRaw?.totalViews ?? '0', 10),
        totalLikes: parseInt(statsRaw?.totalLikes ?? '0', 10),
      },
    }
  }

  /* ---------- 站点 meta 信息抓取 ---------- */

  /**
   * 获取站长（super_admin）公开资料 — 游客访问时的 fallback 信息
   * 复用 getUserBlogProfile 逻辑，自动查找 super_admin 用户
   */
  async getSiteOwnerProfile(req: Request): Promise<{
    user: Partial<IUser>
    settings: Record<string, unknown>
    stats: { articleCount: number; totalViews: number; totalLikes: number }
  } | null> {
    const ds = getDataSource(req)
    const userRepo = ds.getRepository(Users)
    const admin = await userRepo.findOne({
      where: { role: CUserRole.SUPER_ADMIN },
      select: ['username'] as any,
      order: { id: 'ASC' },
    })
    if (!admin) return null
    return this.getUserBlogProfile(req, admin.username)
  }

  /* ---------- 站点 meta 信息抓取（外部网站） ---------- */

  /** 抓取目标网站的 title 和 favicon */
  async fetchSiteMeta(url: string): Promise<{ title: string; icon: string; description: string }> {
    // SSRF 防护：禁止请求内网 IP（私有地址 / 环回地址 / 链路本地地址）
    const { hostname } = new URL(url)
    const blockedPatterns = [
      /^localhost$/i, /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
      /^0\./, /^169\.254\./, /^::1$/, /^fc00:/i, /^fe80:/i, /^fd/i,
    ]
    if (blockedPatterns.some(p => p.test(hostname))) {
      throw new Error('不允许访问内网地址')
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    try {
      const resp = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UccBlogBot/1.0)' },
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const html = await resp.text()
      // 提取 title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      const title = titleMatch?.[1]?.trim() ?? ''
      // 提取 description
      const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)
      const description = descMatch?.[1]?.trim() ?? ''
      // 提取 favicon
      const iconMatch = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i)
        || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i)
      let icon = iconMatch?.[1]?.trim() ?? ''
      // 相对路径转绝对路径
      if (icon && !icon.startsWith('http')) {
        const base = new URL(url)
        icon = icon.startsWith('/') ? `${base.origin}${icon}` : `${base.origin}/${icon}`
      }
      // 无 favicon 则用默认路径
      if (!icon) {
        const base = new URL(url)
        icon = `${base.origin}/favicon.ico`
      }
      return { title, icon, description }
    } finally {
      clearTimeout(timeout)
    }
  }
}

export default new CommonService()
