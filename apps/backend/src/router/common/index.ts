import express, { type Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import CommonController from '@/controller/common'
import * as SettingsController from '@/controller/settings'
import { UploadHandler } from '@/middleware/UploadHandler'
import { requireAuth } from '@/middleware/AuthGuard'
import { requireRole } from '@/middleware/RoleGuard'
import { toResponse } from '@/utils'
import { IUserLogin, CUserRole } from '@u-blog/model'
import ChatService, { type ChatRequestMessage, type ModelConfigOverride } from '@/service/chat'
import CommonService from '@/service/common'

const router = express.Router() as Router

/**
 * 用户偏好类 key — 只需登录即可保存
 * 敏感/管理类 key（openai_api_key、site_name 等）需要 ADMIN 角色
 */
const USER_PREFERENCE_KEYS = new Set([
  'theme', 'language', 'article_list_type', 'home_sort', 'visual_style',
  // 模型配置：所有已登录用户均可保存（API Key 在存储层加密）
  'openai_api_key', 'openai_base_url', 'openai_model',
  'openai_temperature', 'openai_max_tokens', 'openai_system_prompt', 'openai_context_length',
  // 聊天偏好
  'chat_font_size',
  // 站点信息：每个用户可个性化设置
  'site_name', 'site_description', 'site_keywords', 'site_favicon',
  // 多租户：用户个人博客设置
  'visible_routes', 'friend_link_notify', 'only_own_articles', 'blog_theme',
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

router.post('/register', async (req: Request, res: Response) => {
  const result = await CommonController.register(req, res)
  toResponse(result, res)
})

/** 发送邮箱验证码（注册前调用） */
router.post('/send-email-code', async (req: Request, res: Response) => {
  const result = await CommonController.sendEmailCode(req, res)
  toResponse(result, res)
})

router.post('/login', async (req: Request, res: Response) => {
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

router.post('/chat', requireAuth, async (req: Request, res: Response) => {
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

    const stream = await ChatService.chatStream(req, chatMessages, override, typeof ragContext === 'string' ? ragContext : undefined)

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content
      if (delta) {
        // SSE 格式：data: JSON\n\n
        res.write(`data: ${JSON.stringify({ token: delta })}\n\n`)
      }
      // 流结束标志
      if (chunk.choices?.[0]?.finish_reason) {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
      }
    }
  } catch (err: any) {
    // 错误也通过 SSE 事件发送，前端统一处理
    const msg = err?.message || 'AI 请求失败'
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`)
  } finally {
    res.end()
  }
})

/* ---------- AI 文本生成（需要登录） ---------- */
router.post('/ai/generate', requireAuth, async (req: Request, res: Response) => {
  const { prompt, content, config } = req.body || {}

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
    // config 为用户自供的模型配置（非管理员场景）
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
router.get('/fetch-site-meta', async (req: Request, res: Response) => {
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

export default router