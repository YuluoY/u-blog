import type { Repository } from 'typeorm'
import type { Request } from 'express'
import { Users } from '@/module/schema/Users'
import { Media } from '@/module/schema/Media'
import { Article } from '@/module/schema/Article'
import { Category } from '@/module/schema/Category'
import { Tag } from '@/module/schema/Tag'
import { Setting } from '@/module/schema/Setting'
import { View } from '@/module/schema/View'
import {
  IUserRegisterDto, CUserRole, IUserLogin, IUser,
  IUserRegister, IUserVo, CArticleStatus,
} from '@u-blog/model'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { getRandomString } from '@u-blog/utils'
import { sign, signRt, verify, decode } from '@/plugin/jwt'
import { formatValidationErrors, encrypt, decrypt, getDataSource } from '@/utils'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import appCfg from '@/app'

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
  'openai_base_url',
  'anthropic_api_key',
  'api_key',
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

/* ========== CommonService 类 ========== */

class CommonService {

  /* ---------- 认证相关 ---------- */

  async register(
    req: Request,
    userRepo: Repository<Users>,
    data: IUserRegisterDto,
    ret: number = 0,
  ) {
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
      role: data.role || CUserRole.USER,
      isActive: data.isActive !== undefined ? data.isActive : true,
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
      const { password, rthash: _, ...userInfo } = user
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

    // 4. 解密数据库中的密码并验证
    let decryptedPassword: string
    try {
      decryptedPassword = decrypt(user.password)
    } catch {
      throw new Error('密码数据损坏，请联系管理员')
    }

    if (decryptedPassword !== data.password) {
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
    const { password: _, rthash: __, ...userInfo } = user
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

    const { rthash: _, ...userInfo } = user
    return { ...userInfo, token, rt: newRt }
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
    const earliestCreated = agg?.earliestCreated ? new Date(agg.earliestCreated) : null
    const latestUpdated = agg?.latestUpdated ? new Date(agg.latestUpdated) : null

    const runningDays = earliestCreated
      ? Math.max(1, Math.floor((Date.now() - earliestCreated.getTime()) / 86400000))
      : 0

    let lastUpdate = '--'
    if (latestUpdated) {
      const d = latestUpdated
      lastUpdate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }

    return { articleCount, categoryCount, tagCount, totalViews, totalLikes, totalComments, runningDays, lastUpdate }
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

  /* ---------- 系统设置 ---------- */

  /**
   * 按 key 列表查询设置，返回 key -> { value, desc?, masked? }
   * 不传 keys 时返回全部
   */
  async getSettings(
    req: Request,
    keys?: string[],
  ): Promise<Record<string, { value: unknown; desc?: string | null; masked?: boolean }>> {
    const repo = getDataSource(req).getRepository(Setting) as Repository<Setting>
    const qb = repo.createQueryBuilder('s')
    if (keys && keys.length > 0) {
      qb.andWhere('s.key IN (:...keys)', { keys })
    }
    const list = await qb.getMany()
    const out: Record<string, { value: unknown; desc?: string | null; masked?: boolean }> = {}
    for (const row of list) {
      const masked = MASK_KEYS.has(row.key)
      out[row.key] = {
        value: masked ? maskValue(row.value) : row.value,
        desc: row.desc ?? undefined,
        masked: masked ? true : undefined,
      }
    }
    return out
  }

  /**
   * 批量 upsert 设置（按 key 存在则更新，否则插入）
   */
  async setSettings(
    req: Request,
    record: Record<string, { value: unknown; desc?: string }>,
  ): Promise<void> {
    const repo = getDataSource(req).getRepository(Setting) as Repository<Setting>
    for (const [key, { value, desc }] of Object.entries(record)) {
      const existing = await repo.findOne({ where: { key } })
      if (existing) {
        existing.value = value
        if (desc !== undefined) existing.desc = desc
        await repo.save(existing)
      } else {
        const entity = repo.create({ key, value, desc: desc ?? null })
        await repo.save(entity)
      }
    }
  }
}

export default new CommonService()
