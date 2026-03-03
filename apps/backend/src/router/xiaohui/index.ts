import express, { type Router, type Request, type Response, type NextFunction } from 'express'
import rateLimit from 'express-rate-limit'
import XiaohuiService from '@/service/xiaohui'
import { detectBlogIntent, BlogContextBuilder } from '@/service/xiaohui/blogContext'
import type { IXiaohuiMessage } from '@/module/schema/XiaohuiConversation'
import { getClientIp } from '@/utils'
import { requireAuth } from '@/middleware/AuthGuard'
import { requireRole } from '@/middleware/RoleGuard'
import { CUserRole } from '@u-blog/model'

const router = express.Router() as Router
const adminOnly = [requireAuth, requireRole(CUserRole.ADMIN)]

/** 延迟工具函数 */
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

/**
 * 将文本拆分为适合打字机效果的小片段
 * - XCMD 命令 / URL / Markdown 链接：保持完整不拆分
 * - CJK 字符：每 1-2 个一组
 * - 英文单词：整词一组（含尾随空格）
 * - 其他（标点、emoji、空白）：单个一组
 */
function splitIntoSegments(text: string): string[] {
  // 已经足够短，无需拆分
  if (text.length <= 4) return [text]

  const segments: string[] = []
  // 顺序优先级：长特殊模式 → 英文单词 → CJK 字符 → 其余单字符
  const re = /<!--XCMD:[^>]+-->|https?:\/\/[^\s)\]]+|\[[^\]]*?\]\([^)]*?\)|[a-zA-Z0-9_]+\s?|[\u4e00-\u9fff\u3400-\u4dbf]{1,2}|[\s\S]/gu
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    segments.push(m[0])
  }
  return segments.length > 0 ? segments : [text]
}

const _isDev = process.env.NODE_ENV !== 'production'

/** 反刷规则：5 秒内 >= 3 次请求，判定恶意 */
const BURST_WINDOW_MS = 5 * 1000
const BURST_THRESHOLD = 3
/** 自动封禁时长（毫秒） */
const AUTO_BAN_MS = 10 * 60 * 1000

interface IpBanRecord {
  ip: string
  reason: string
  source: 'auto' | 'manual'
  createdAt: number
  until: number
  triggerCount?: number
}

/** 最近请求时间戳窗口：Map<ip, timestamps[]> */
const xiaohuiBurstMap = new Map<string, number[]>()
/** 当前封禁列表：Map<ip, banRecord> */
const xiaohuiBanMap = new Map<string, IpBanRecord>()

function isLocalIp(ip: string): boolean {
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'
}

/** 清理过期封禁与过期窗口，避免内存累积 */
setInterval(() => {
  const now = Date.now()

  for (const [ip, record] of xiaohuiBanMap) {
    if (record.until <= now) xiaohuiBanMap.delete(ip)
  }

  for (const [ip, timestamps] of xiaohuiBurstMap) {
    const valid = timestamps.filter(ts => now - ts <= BURST_WINDOW_MS)
    if (valid.length === 0) xiaohuiBurstMap.delete(ip)
    else xiaohuiBurstMap.set(ip, valid)
  }
}, 60_000)

/**
 * 小惠接口反刷中间件
 * 规则：同一 IP 在 5 秒窗口内请求数 >= 3，立即封禁（默认 10 分钟）
 */
function xiaohuiAbuseGuard(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req) || req.ip || req.socket?.remoteAddress || ''
  if (!ip) {
    next()
    return
  }

  if (_isDev && isLocalIp(ip)) {
    next()
    return
  }

  const now = Date.now()
  const ban = xiaohuiBanMap.get(ip)

  if (ban && ban.until > now) {
    const retryAfterSec = Math.ceil((ban.until - now) / 1000)
    res.setHeader('Retry-After', String(retryAfterSec))
    res.status(429).json({
      code: 429,
      data: { retryAfterSec, source: ban.source },
      message: `该 IP 已被限制访问，请 ${retryAfterSec}s 后重试`,
    })
    return
  }

  if (ban && ban.until <= now) {
    xiaohuiBanMap.delete(ip)
  }

  const history = (xiaohuiBurstMap.get(ip) || []).filter(ts => now - ts <= BURST_WINDOW_MS)
  history.push(now)
  xiaohuiBurstMap.set(ip, history)

  if (history.length >= BURST_THRESHOLD) {
    const until = now + AUTO_BAN_MS
    xiaohuiBanMap.set(ip, {
      ip,
      reason: `5秒内请求达到${history.length}次（阈值${BURST_THRESHOLD}）`,
      source: 'auto',
      createdAt: now,
      until,
      triggerCount: history.length,
    })
    xiaohuiBurstMap.delete(ip)
    console.warn(`[xiaohui][abuse] auto ban ip=${ip}, hits=${history.length}, until=${new Date(until).toISOString()}`)

    const retryAfterSec = Math.ceil((until - now) / 1000)
    res.setHeader('Retry-After', String(retryAfterSec))
    res.status(429).json({
      code: 429,
      data: { retryAfterSec, source: 'auto' },
      message: '请求过于频繁，已触发风控限制，请稍后再试',
    })
    return
  }

  next()
}

/** 小惠对话限流：同一 IP 每分钟最多 20 条消息 */
const xiaohuiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, data: null, message: '小惠有点忙，请稍后再试~' },
  validate: { trustProxy: false },
  skip: (req) => {
    if (!_isDev) return false
    const ip = req.ip || req.socket?.remoteAddress || ''
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'
  },
})

/**
 * POST /xiaohui/chat — 小惠 AI 流式对话
 * 游客和已登录用户均可使用，所有对话记录到数据库
 */
router.post('/chat', xiaohuiAbuseGuard, xiaohuiLimiter, async (req: Request, res: Response) => {
  const { message, messages, sessionId } = req.body || {}

  // 兼容两种传参：messages 数组（多轮）或 message 字符串（单条）
  let chatMessages: IXiaohuiMessage[]
  if (Array.isArray(messages) && messages.length > 0) {
    chatMessages = messages
      .filter((m: any) => m && typeof m.content === 'string' && ['user', 'assistant'].includes(m.role))
      .map((m: any) => ({ role: m.role, content: m.content, timestamp: m.timestamp || Date.now() }))
  } else {
    const text = typeof message === 'string' ? message.trim() : ''
    if (!text) {
      res.json({ code: 1, message: '请输入消息内容', data: null })
      return
    }
    chatMessages = [{ role: 'user', content: text, timestamp: Date.now() }]
  }

  if (chatMessages.length === 0) {
    res.json({ code: 1, message: '请输入消息内容', data: null })
    return
  }

  // 安全校验：只检查最后一条用户消息（当前输入）
  // 之前被拦截的消息不会发送给 AI（返回了错误响应），
  // 但前端仍保留在对话历史中，若全量校验会导致后续正常消息也被阻断
  const lastUserMessage = [...chatMessages].reverse().find(m => m.role === 'user')
  if (lastUserMessage) {
    const rejection = XiaohuiService.validateInput(lastUserMessage.content)
    if (rejection) {
      res.json({ code: 1, message: rejection, data: null })
      return
    }
  }

  // 清洗历史消息：过滤掉之前被拦截的危险用户消息，避免注入到 AI 上下文
  // 仅保留安全的历史（被拦截的消息不应作为 AI 上下文）
  chatMessages = chatMessages.filter(msg => {
    if (msg.role !== 'user') return true
    return !XiaohuiService.validateInput(msg.content)
  })

  // 限制上下文长度（最多保留最近 20 条消息）
  if (chatMessages.length > 20) {
    chatMessages = chatMessages.slice(-20)
  }

  // 取最后一条用户消息用于日志记录
  const lastUserMsg = [...chatMessages].reverse().find(m => m.role === 'user')

  const sid = typeof sessionId === 'string' && sessionId ? sessionId : `anon_${Date.now()}`
  const startTime = Date.now()

  // 并行构建：用户上下文（IP/地理/天气）+ 博客数据上下文，避免串行等待
  const userContextPromise = XiaohuiService.buildUserContext(req)
    .catch(() => ({ contextText: '', location: null }))

  let blogContextPromise: Promise<string> = Promise.resolve('')
  if (lastUserMsg) {
    const intent = detectBlogIntent(lastUserMsg.content)
    if (intent) {
      blogContextPromise = BlogContextBuilder.buildBlogContext(req, intent).catch((err) => {
        console.error('[xiaohui] 博客上下文构建失败:', err)
        return ''
      })
    }
  }

  // 等待两者同时完成
  const [{ contextText: userContext, location: userLocation }, blogContext] =
    await Promise.all([userContextPromise, blogContextPromise])

  // 合并用户上下文和博客上下文
  const fullContext = userContext + blogContext

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  let fullReply = ''
  let status: 'success' | 'error' | 'aborted' = 'success'

  try {
    const stream = await XiaohuiService.chatStream(chatMessages, fullContext)

    // SSE 超时保护：最长 3 分钟
    const SSE_TIMEOUT_MS = 3 * 60 * 1000
    const sseTimer = setTimeout(() => {
      status = 'error'
      res.write(`data: ${JSON.stringify({ error: '响应超时，请重新发送' })}\n\n`)
      res.end()
    }, SSE_TIMEOUT_MS)

    // 从 OpenClaw 的 SSE 响应中解析并转发
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // 按 SSE 事件分割
      const parts = buffer.split('\n')
      const newBuffer: string[] = []

      for (let i = 0; i < parts.length; i++) {
        const line = parts[i]

        // 如果是最后一行且没有换行结尾，可能不完整
        if (i === parts.length - 1 && !buffer.endsWith('\n')) {
          newBuffer.push(line)
          continue
        }

        if (!line.startsWith('data: ')) continue
        const jsonStr = line.slice(6).trim()
        if (jsonStr === '[DONE]') {
          // 流式完成
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
          continue
        }

        try {
          const chunk = JSON.parse(jsonStr)

          // 【绝对防御】拦截工具调用：阻断 AI 任何文件操作行为
          // 即使 tool_choice:"none" 被绕过，这里也会拦截 tool_calls delta
          const toolCalls = chunk.choices?.[0]?.delta?.tool_calls
          if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
            // 记录拦截日志（安全审计）
            console.warn('[xiaohui] 拦截到工具调用:', JSON.stringify(toolCalls))
            // 跳过此 chunk，不转发给客户端
            continue
          }

          // finish_reason 为 tool_calls 时，也表示 AI 想调用工具，直接终止
          const finishReason = chunk.choices?.[0]?.finish_reason
          if (finishReason === 'tool_calls' || finishReason === 'function_call') {
            console.warn('[xiaohui] 拦截到工具调用 finish_reason:', finishReason)
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
            continue
          }

          const delta = chunk.choices?.[0]?.delta?.content
          if (delta) {
            // 过滤敏感内容
            const safeContent = XiaohuiService.sanitizeResponse(delta)
            fullReply += safeContent

            // 拆分为小片段逐个推送，前端打字机效果
            const segments = splitIntoSegments(safeContent)
            for (let si = 0; si < segments.length; si++) {
              res.write(`data: ${JSON.stringify({ token: segments[si] })}\n\n`)
              // 多片段间加 20ms 延迟实现平滑输出
              if (segments.length > 1 && si < segments.length - 1) {
                await sleep(20)
              }
            }
          }
          // 非流式 finish_reason
          if (finishReason) {
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
          }
        } catch {
          // 忽略无法解析的行
        }
      }

      buffer = newBuffer.join('\n')
    }

    clearTimeout(sseTimer)
  } catch (err: any) {
    status = 'error'
    const msg = err?.message || '小惠暂时无法回答，请稍后再试'
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`)
  } finally {
    res.end()

    // 异步写入对话日志（不阻塞响应）
    const latencyMs = Date.now() - startTime
    const userMsg = lastUserMsg?.content || ''
    XiaohuiService.logConversation(
      req,
      sid,
      userMsg,
      fullReply || null,
      chatMessages,
      latencyMs,
      status,
      userLocation
    ).catch(() => {})
  }
})

/**
 * GET /xiaohui/ip-guard/list — 获取当前封禁 IP 列表（admin）
 */
router.get('/ip-guard/list', ...adminOnly, (_req: Request, res: Response) => {
  const now = Date.now()
  const list = [...xiaohuiBanMap.values()]
    .filter(item => item.until > now)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(item => ({
      ...item,
      retryAfterSec: Math.ceil((item.until - now) / 1000),
    }))
  res.json({ code: 0, data: { list, total: list.length }, message: 'ok' })
})

/**
 * POST /xiaohui/ip-guard/ban — 手动封禁 IP（admin）
 * body: { ip: string, minutes?: number, reason?: string }
 */
router.post('/ip-guard/ban', ...adminOnly, (req: Request, res: Response) => {
  const ip = String(req.body?.ip || '').trim()
  const minutes = Math.max(1, Number(req.body?.minutes || 60))
  const reason = String(req.body?.reason || '管理员手动封禁').trim() || '管理员手动封禁'

  if (!ip) {
    res.json({ code: 1, data: null, message: '缺少 IP 参数' })
    return
  }

  const now = Date.now()
  const until = now + minutes * 60 * 1000
  xiaohuiBanMap.set(ip, {
    ip,
    reason,
    source: 'manual',
    createdAt: now,
    until,
  })
  xiaohuiBurstMap.delete(ip)
  res.json({ code: 0, data: { ip, until }, message: '封禁成功' })
})

/**
 * POST /xiaohui/ip-guard/unban — 解除封禁（admin）
 * body: { ip: string }
 */
router.post('/ip-guard/unban', ...adminOnly, (req: Request, res: Response) => {
  const ip = String(req.body?.ip || '').trim()
  if (!ip) {
    res.json({ code: 1, data: null, message: '缺少 IP 参数' })
    return
  }
  xiaohuiBanMap.delete(ip)
  xiaohuiBurstMap.delete(ip)
  res.json({ code: 0, data: { ip }, message: '已解除封禁' })
})

/**
 * GET /xiaohui/status — 小惠服务状态检查
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const response = await fetch(`${process.env.OPENCLAW_URL || 'http://127.0.0.1:18789'}/`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000),
    })
    res.json({
      code: 0,
      data: { available: response.ok },
      message: response.ok ? '小惠在线' : '小惠暂时离线',
    })
  } catch {
    res.json({
      code: 0,
      data: { available: false },
      message: '小惠暂时离线',
    })
  }
})

export default router
