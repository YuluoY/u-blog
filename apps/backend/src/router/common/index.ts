import express, { type Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'
import CommonController from '@/controller/common'
import { buildDefaultCoverFileUrl } from '@/controller/rest'
import * as SettingsController from '@/controller/settings'
import { UploadHandler } from '@/middleware/UploadHandler'
import { requireAuth } from '@/middleware/AuthGuard'
import { requireRole } from '@/middleware/RoleGuard'
import { toResponse, getDataSource } from '@/utils'
import { IUserLogin, CUserRole } from '@u-blog/model'
import ChatService, { type ChatRequestMessage, type ModelConfigOverride } from '@/service/chat'
import CommonService from '@/service/common'
import { UserSetting } from '@/module/schema/UserSetting'
import { getClientIp } from '@/utils'

const router = express.Router() as Router

const _isDev = process.env.NODE_ENV !== 'production'

/** 开发环境跳过 localhost 限流（Vite dev proxy 全走 127.0.0.1） */
function skipLocalhost(req: import('express').Request): boolean {
  if (!_isDev) return false
  const ip = req.ip || req.socket?.remoteAddress || ''
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'
}

/** 认证相关限流：同一 IP 15 分钟内最多 15 次（注册/登录/邮箱验证码） */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, data: null, message: '操作过于频繁，请稍后再试' },
  validate: { trustProxy: false },
  skip: skipLocalhost,
})

/** 站点信息抓取限流：同一 IP 1 分钟内最多 10 次 */
const fetchMetaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, data: null, message: '请求过于频繁，请稍后再试' },
  validate: { trustProxy: false },
  skip: skipLocalhost,
})

/**
 * 用户偏好类 key — 只需登录即可保存
 * 所有已登录用户均可自定义模型配置（API Key 在存储层加密）
 */
const USER_PREFERENCE_KEYS = new Set([
  'theme', 'language', 'article_list_type', 'home_sort', 'visual_style',
  // 模型配置：所有已登录用户均可保存
  'openai_api_key', 'openai_base_url', 'openai_model',
  'openai_temperature', 'openai_max_tokens', 'openai_system_prompt', 'openai_context_length',
  // 聊天偏好
  'chat_font_size',
  // 站点信息：每个用户可个性化设置
  'site_name', 'site_description', 'site_keywords', 'site_favicon',
  // 多租户：用户个人博客设置
  'visible_routes', 'friend_link_notify', 'only_own_articles', 'blog_theme',
  // 博客分享模式
  'blog_share_mode',
])

/**
 * 设置写入权限中间件：
 * - 若请求 body 中所有 key 皆为用户偏好 → 仅需登录
 * - 否则 → 需要 ADMIN 角色
 */
function settingsWriteGuard(req: Request, res: Response, next: NextFunction): void {
  const body = req.body || {}
  // 提取待写入的 key 列表
  let keys: string[] = []
  if (body.key !== undefined) {
    keys = [String(body.key)]
  } else if (body.settings && Array.isArray(body.settings)) {
    keys = body.settings.map((s: any) => String(s?.key)).filter(Boolean)
  } else if (typeof body === 'object' && !Array.isArray(body)) {
    keys = Object.keys(body).filter(k => !['settings', 'key', 'value', 'desc'].includes(k))
  }
  const allPreference = keys.length > 0 && keys.every(k => USER_PREFERENCE_KEYS.has(k))
  if (allPreference) {
    // 用户偏好 — 仅需认证
    next()
  } else {
    // 包含管理类 key — 需要 ADMIN 角色
    requireRole(CUserRole.ADMIN)(req, res, next)
  }
}

router.get('/settings', (req: Request, res: Response) => SettingsController.getSettings(req, res))
router.put('/settings', requireAuth, settingsWriteGuard, (req: Request, res: Response) => SettingsController.putSettings(req, res))

router.get('/site-overview', async (req: Request, res: Response) => {
  const result = await CommonController.getSiteOverview(req, res)
  toResponse(result, res)
})

router.get('/cloud-weights', async (req: Request, res: Response) => {
  const result = await CommonController.getCloudWeights(req, res)
  toResponse(result, res)
})

router.get('/article-search', async (req: Request, res: Response) => {
  const result = await CommonController.searchArticles(req, res)
  toResponse(result, res)
})

/** 公开接口：查询注册是否开放 */
router.get('/registration-status', async (req: Request, res: Response) => {
  try {
    const status = await CommonService.isRegistrationEnabled(req)
    res.json({ code: 0, data: status, message: 'ok' })
  } catch (err: any) {
    res.json({ code: 1, data: { enabled: false, reason: '查询失败' }, message: err?.message || '查询失败' })
  }
})

router.post('/register', authLimiter, async (req: Request, res: Response) => {
  const result = await CommonController.register(req, res)
  toResponse(result, res)
})

/** 发送邮箱验证码（注册前调用） */
router.post('/send-email-code', authLimiter, async (req: Request, res: Response) => {
  const result = await CommonController.sendEmailCode(req, res)
  toResponse(result, res)
})

router.post('/login', authLimiter, async (req: Request, res: Response) => {
  const result = await CommonController.login<IUserLogin>(req, res)
  toResponse(result, res)
})

router.post('/refresh', async (req: Request, res: Response) => {
  const result = await CommonController.refreshToken(req, res)
  toResponse(result, res)
})

router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  const result = await CommonController.logout(req, res)
  toResponse(result, res)
})

/**
 * /chat 专用认证中间件 — 三层防线：
 * 1. 已登录用户：直接放行（使用自己的模型配置）
 * 2. 游客 + blogOwnerId：从 DB 验证博主的 blog_share_mode === 'full' 后放行
 * 3. 其他情况：401 拒绝
 *
 * 通过后将有效的 blogOwnerId 挂到 res.locals.chatBlogOwnerId，供路由处理函数使用。
 */
async function chatAuthGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  // 已登录用户直接放行
  if (req.user) { next(); return }

  // 游客场景：必须携带 blogOwnerId（子域名博客模式）
  const blogOwnerId = Number(req.body?.blogOwnerId)
  if (!blogOwnerId || !Number.isFinite(blogOwnerId)) {
    res.status(401).json({ code: 401, data: null, message: '请先登录' })
    return
  }

  // 服务端验证：博主是否开启了完整分享模式
  try {
    const ds = getDataSource(req)
    const userSettingRepo = ds.getRepository(UserSetting)
    const shareModeSetting = await userSettingRepo.findOne({
      where: { userId: blogOwnerId, key: 'blog_share_mode' },
    })
    if (shareModeSetting?.value !== 'full') {
      res.status(403).json({ code: 403, data: null, message: '该博客未开放此功能' })
      return
    }
    // 验证通过，将 blogOwnerId 传递给后续处理
    res.locals.chatBlogOwnerId = blogOwnerId
    next()
  } catch {
    res.status(500).json({ code: 500, data: null, message: '服务器内部错误' })
  }
}

function writeSse(res: Response, payload: unknown): void {
  res.write(`data: ${JSON.stringify(payload)}\n\n`)
  ;(res as Response & { flush?: () => void }).flush?.()
}

router.post('/chat', chatAuthGuard, async (req: Request, res: Response) => {
  const { message, messages, config, context: ragContext } = req.body || {}

  // 兼容两种传参：messages 数组（多轮）或 message 字符串（单条）
  let chatMessages: ChatRequestMessage[]
  if (Array.isArray(messages) && messages.length > 0) {
    chatMessages = messages.filter(
      (m: any) => m && typeof m.content === 'string' && ['user', 'assistant'].includes(m.role)
    )
  } else {
    const text = typeof message === 'string' ? message.trim() : ''
    if (!text) {
      res.json({ code: 1, message: '请发送文本消息', data: null })
      return
    }
    chatMessages = [{ role: 'user', content: text }]
  }

  if (chatMessages.length === 0) {
    res.json({ code: 1, message: '请发送文本消息', data: null })
    return
  }

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no') // Nginx 不缓冲
  res.flushHeaders()

  try {
    // 提取可选的模型参数覆盖（温度、最大输出等）
    const override: ModelConfigOverride | undefined = config && typeof config === 'object'
      ? {
          apiKey: '', // 不允许前端直接传 API Key，始终使用服务端配置
          ...(config.temperature != null ? { temperature: Number(config.temperature) } : {}),
          ...(config.maxTokens != null ? { maxTokens: Number(config.maxTokens) } : {}),
        }
      : undefined

    // 游客场景下使用博主的模型配置（chatAuthGuard 已验证 share_mode）
    const chatBlogOwnerId: number | undefined = res.locals.chatBlogOwnerId

    const stream = await ChatService.chatStream(req, chatMessages, override, typeof ragContext === 'string' ? ragContext : undefined, chatBlogOwnerId)

    // SSE 超时保护：最长 3 分钟
    const SSE_TIMEOUT_MS = 3 * 60 * 1000
    const sseTimer = setTimeout(() => {
      writeSse(res, { error: '响应超时，请重新发送' })
      res.end()
    }, SSE_TIMEOUT_MS)

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content
      if (delta) {
        // SSE 格式：data: JSON\n\n
        writeSse(res, { token: delta })
      }
      // 流结束标志
      if (chunk.choices?.[0]?.finish_reason) {
        writeSse(res, { done: true })
      }
    }
    clearTimeout(sseTimer)
  } catch (err: any) {
    // 错误也通过 SSE 事件发送，前端统一处理
    const msg = err?.message || 'AI 请求失败'
    writeSse(res, { error: msg })
  } finally {
    res.end()
  }
})

/* ---------- AI 文本生成（登录用户或自备 API Key 的游客） ---------- */
router.post('/ai/generate', async (req: Request, res: Response) => {
  const { prompt, content, config } = req.body || {}

  // 游客必须提供自己的 config（含 apiKey），否则需要登录
  if (!req.user && !config?.apiKey) {
    res.status(401).json({ code: 401, data: null, message: '请先登录或配置 API Key' })
    return
  }

  // 参数校验
  if (!prompt || typeof prompt !== 'string') {
    res.json({ code: 1, message: '缺少 prompt 参数', data: null })
    return
  }
  if (!content || typeof content !== 'string') {
    res.json({ code: 1, message: '缺少 content 参数', data: null })
    return
  }

  try {
    // config 为用户自供的模型配置（游客或非管理员场景）
    const override: ModelConfigOverride | undefined = config?.apiKey ? config : undefined
    const text = await ChatService.generate(req, prompt, content, override)
    res.json({ code: 0, data: { text }, message: 'ok' })
  } catch (err: any) {
    const msg = err?.message || 'AI 生成失败'
    res.json({ code: 1, message: msg, data: null })
  }
})

/* ---------- 文件上传（需要登录） ---------- */
router.post('/upload', requireAuth, UploadHandler('file'), async (req: Request, res: Response) => {
  const result = await CommonController.upload(req, res)
  toResponse(result, res)
})

/**
 * 生成默认封面图：根据标题生成渐变 + 文字排版的 PNG 封面
 * @body { title: string } 文章标题
 * @returns { code: 0, data: { url: string } }
 */
router.post('/generate-cover', requireAuth, async (req: Request, res: Response) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : ''
  try {
    const url = await buildDefaultCoverFileUrl(title || '无题小记')
    res.json({ code: 0, data: { url }, message: 'ok' })
  } catch (err: any) {
    res.json({ code: 1, data: null, message: err?.message || '封面生成失败' })
  }
})

/* ---------- 个人资料更新（需要登录） ---------- */
router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  const result = await CommonController.updateProfile(req, res)
  toResponse(result, res)
})

router.delete('/media', requireAuth, async (req: Request, res: Response) => {
  const result = await CommonController.deleteMedia(req, res)
  toResponse(result, res)
})

/* ---------- 浏览量统计 ---------- */

/** 文章浏览计数（同 IP 10 分钟去重） */
router.post('/article-view', async (req: Request, res: Response) => {
  const result = await CommonController.recordArticleView(req, res)
  toResponse(result, res)
})

/** 站点访问记录（同 IP 每日去重） */
router.post('/site-visit', async (req: Request, res: Response) => {
  const result = await CommonController.recordSiteVisit(req, res)
  toResponse(result, res)
})

/** 文章点赞切换（登录用户 DB 去重 / 游客 IP+fingerprint 去重） */
router.post('/article-like', async (req: Request, res: Response) => {
  const result = await CommonController.toggleArticleLike(req, res)
  toResponse(result, res)
})

/** 查询文章点赞状态 */
router.get('/article-like-status', async (req: Request, res: Response) => {
  const result = await CommonController.getArticleLikeStatus(req, res)
  toResponse(result, res)
})

/** 评论点赞切换（登录用户 DB 去重 / 游客 IP+fingerprint 去重） */
router.post('/comment-like', async (req: Request, res: Response) => {
  const result = await CommonController.toggleCommentLike(req, res)
  toResponse(result, res)
})

/** 查询评论点赞状态 */
router.get('/comment-like-status', async (req: Request, res: Response) => {
  const result = await CommonController.getCommentLikeStatus(req, res)
  toResponse(result, res)
})

/** 批量查询评论点赞状态 */
router.post('/comment-like-statuses', async (req: Request, res: Response) => {
  const result = await CommonController.getCommentLikeStatuses(req, res)
  toResponse(result, res)
})

/**
 * QQ 信息代理：根据 QQ 号获取昵称
 * 代理腾讯 QZone 接口，处理 GBK 编码和 JSONP 解析
 */
router.get('/qq-info', async (req: Request, res: Response) => {
  const qq = String(req.query.qq || '').trim()
  // 校验 QQ 号格式：5~11 位数字
  if (!/^\d{5,11}$/.test(qq)) {
    res.json({ code: 1, message: '无效的 QQ 号', data: null })
    return
  }
  try {
    const url = `https://users.qzone.qq.com/fcg-bin/cgi_get_portrait.fcg?uins=${qq}`
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!resp.ok) {
      res.json({ code: 1, message: 'QQ 信息获取失败', data: null })
      return
    }
    // 响应体为 GBK 编码，需要转码为 UTF-8
    const buf = await resp.arrayBuffer()
    const text = new TextDecoder('gbk').decode(buf)
    // JSONP 格式: portraitCallBack({...})
    const jsonStr = text.replace(/^[^(]*\(/, '').replace(/\)\s*$/, '')
    const data = JSON.parse(jsonStr)
    const info = data[qq]
    let nickname = info?.[6] || ''
    // 过滤乱码昵称（GBK 解码失败产生的 U+FFFD 或 "锟斤拷" 等）
    if (nickname && (/\uFFFD/.test(nickname) || /锟斤拷/.test(nickname))) {
      nickname = ''
    }
    res.json({ code: 0, data: { nickname, qq }, message: 'ok' })
  } catch {
    res.json({ code: 1, message: 'QQ 信息获取超时或不可用', data: null })
  }
})

/* ========== 友情链接 ========== */

/** 公开接口：获取某用户的已审核友链 */
router.get('/friend-links', async (req: Request, res: Response) => {
  const userId = Number(req.query.userId)
  if (!userId || isNaN(userId)) {
    res.json({ code: 1, message: '缺少 userId 参数', data: null })
    return
  }
  try {
    const list = await CommonService.getFriendLinks(req, userId)
    res.json({ code: 0, data: list, message: 'ok' })
  } catch (err: any) {
    res.json({ code: 1, message: err?.message || '获取友链失败', data: null })
  }
})

/** 需登录：获取当前用户的全部友链（含待审核/已拒绝，用于管理） */
router.get('/friend-links/manage', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id
  try {
    const list = await CommonService.getAllFriendLinks(req, userId)
    res.json({ code: 0, data: list, message: 'ok' })
  } catch (err: any) {
    res.json({ code: 1, message: err?.message || '获取友链失败', data: null })
  }
})

/** 公开接口：提交友链申请 */
router.post('/friend-links', async (req: Request, res: Response) => {
  const { userId, url, title, icon, description, email } = req.body || {}
  if (!userId || !url || !title) {
    res.json({ code: 1, message: '缺少必填参数（userId, url, title）', data: null })
    return
  }
  try {
    const link = await CommonService.submitFriendLink(req, { userId, url, title, icon, description, email })
    res.json({ code: 0, data: link, message: '友链申请已提交，等待审核' })
  } catch (err: any) {
    res.json({ code: 1, message: err?.message || '提交友链失败', data: null })
  }
})

/** 需登录：审核友链（通过/拒绝） */
router.put('/friend-links/:id/review', requireAuth, async (req: Request, res: Response) => {
  const linkId = Number(req.params.id)
  const ownerId = req.user!.id
  const { action } = req.body || {}
  if (!['approve', 'reject'].includes(action)) {
    res.json({ code: 1, message: 'action 必须为 approve 或 reject', data: null })
    return
  }
  try {
    const link = await CommonService.reviewFriendLink(req, linkId, ownerId, action)
    res.json({ code: 0, data: link, message: action === 'approve' ? '已通过' : '已拒绝' })
  } catch (err: any) {
    res.json({ code: 1, message: err?.message || '审核失败', data: null })
  }
})

/** 需登录：更新友链排序 */
router.put('/friend-links/:id/sort', requireAuth, async (req: Request, res: Response) => {
  const linkId = Number(req.params.id)
  const ownerId = req.user!.id
  const { sortOrder } = req.body || {}
  if (typeof sortOrder !== 'number') {
    res.json({ code: 1, message: 'sortOrder 必须为数字', data: null })
    return
  }
  try {
    const link = await CommonService.updateFriendLinkSort(req, linkId, ownerId, sortOrder)
    res.json({ code: 0, data: link, message: '排序已更新' })
  } catch (err: any) {
    res.json({ code: 1, message: err?.message || '更新排序失败', data: null })
  }
})

/** 需登录：删除友链 */
router.delete('/friend-links/:id', requireAuth, async (req: Request, res: Response) => {
  const linkId = Number(req.params.id)
  const ownerId = req.user!.id
  try {
    await CommonService.deleteFriendLink(req, linkId, ownerId)
    res.json({ code: 0, data: null, message: '已删除' })
  } catch (err: any) {
    res.json({ code: 1, message: err?.message || '删除失败', data: null })
  }
})

/* ========== 用户博客公开资料 ========== */

/** 获取站长（super_admin）公开信息 — 游客侧栏展示用，无需认证 */
router.get('/site-owner', async (req: Request, res: Response) => {
  try {
    const profile = await CommonService.getSiteOwnerProfile(req)
    if (!profile) {
      res.json({ code: 1, message: '站长信息不存在', data: null })
      return
    }
    res.json({ code: 0, data: profile, message: 'ok' })
  } catch (err: any) {
    res.json({ code: 1, message: err?.message || '获取站长信息失败', data: null })
  }
})

/** 根据用户名获取博客公开信息（用户资料 + 个人设置 + 文章统计） */
router.get('/u/:username', async (req: Request, res: Response) => {
  const { username } = req.params
  if (!username?.trim()) {
    res.json({ code: 1, message: '缺少 username 参数', data: null })
    return
  }
  try {
    const profile = await CommonService.getUserBlogProfile(req, username.trim())
    res.json({ code: 0, data: profile, message: 'ok' })
  } catch (err: any) {
    res.json({ code: 1, message: err?.message || '获取用户信息失败', data: null })
  }
})

/* ========== 站点信息抓取 ========== */

/** 抓取目标网站 meta 信息（title / favicon / description） */
router.get('/fetch-site-meta', fetchMetaLimiter, async (req: Request, res: Response) => {
  const url = String(req.query.url || '').trim()
  if (!url) {
    res.json({ code: 1, message: '缺少 url 参数', data: null })
    return
  }
  // 基本 URL 格式校验
  try { new URL(url) } catch {
    res.json({ code: 1, message: 'URL 格式不正确', data: null })
    return
  }
  try {
    const meta = await CommonService.fetchSiteMeta(url)
    res.json({ code: 0, data: meta, message: 'ok' })
  } catch (err: any) {
    res.json({ code: 1, message: err?.message || '抓取站点信息失败', data: null })
  }
})

/**
 * IP 定位代理：代理外部 IP 定位服务，避免前端直连跨域 & 优雅降级
 * 主服务：ip.zhengbingdong.com → 失败后回退 ip-api.com
 * GET /ip-location
 */
router.get('/ip-location', async (req: Request, res: Response) => {
  const TIMEOUT_MS = 5000
  // 从请求头中获取真实客户端 IP（经 Nginx X-Forwarded-For / CF-Connecting-IP 转发）
  const clientIp = getClientIp(req) || ''

  // 主服务：ip.zhengbingdong.com（国内快，中文结果）— 传入客户端 IP
  try {
    const ctrl1 = new AbortController()
    const t1 = setTimeout(() => ctrl1.abort(), TIMEOUT_MS)
    const url1 = clientIp
      ? `https://ip.zhengbingdong.com/v1/get?ip=${encodeURIComponent(clientIp)}`
      : 'https://ip.zhengbingdong.com/v1/get'
    const r1 = await fetch(url1, { signal: ctrl1.signal })
    clearTimeout(t1)
    if (r1.ok) {
      const json = await r1.json()
      res.json(json)
      return
    }
  } catch { /* 主服务不可用，尝试备用 */ }

  // 备用服务：ip-api.com（无需 key，有速率限制）— 传入客户端 IP
  try {
    const ctrl2 = new AbortController()
    const t2 = setTimeout(() => ctrl2.abort(), TIMEOUT_MS)
    const ipSegment = clientIp ? `/${encodeURIComponent(clientIp)}` : ''
    const r2 = await fetch(`http://ip-api.com/json${ipSegment}?fields=country,regionName,city,query,lat,lon&lang=zh-CN`, { signal: ctrl2.signal })
    clearTimeout(t2)
    if (r2.ok) {
      const data = await r2.json() as Record<string, unknown>
      // 适配为主服务相同的返回格式
      res.json({
        ret: 200,
        data: {
          ip: data.query || clientIp,
          city: data.city,
          prov: data.regionName,
          country: data.country,
          lat: data.lat,
          lng: data.lon,
        },
      })
      return
    }
  } catch { /* 备用也不可用 */ }

  // 两个服务均不可用
  res.json({ ret: 0, data: null, message: 'IP 定位服务暂不可用' })
})

export default router