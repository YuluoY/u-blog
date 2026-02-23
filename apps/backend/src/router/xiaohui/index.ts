import express, { type Router, type Request, type Response } from 'express'
import rateLimit from 'express-rate-limit'
import XiaohuiService from '@/service/xiaohui'
import type { IXiaohuiMessage } from '@/module/schema/XiaohuiConversation'

const router = express.Router() as Router

const _isDev = process.env.NODE_ENV !== 'production'

/** 小惠对话限流：同一 IP 每分钟最多 20 条消息 */
const xiaohuiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, data: null, message: '小惠有点忙，请稍后再试~' },
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
router.post('/chat', xiaohuiLimiter, async (req: Request, res: Response) => {
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

  // 取最后一条用户消息做安全校验
  const lastUserMsg = [...chatMessages].reverse().find(m => m.role === 'user')
  if (lastUserMsg) {
    const rejection = XiaohuiService.validateInput(lastUserMsg.content)
    if (rejection) {
      res.json({ code: 1, message: rejection, data: null })
      return
    }
  }

  // 限制上下文长度（最多保留最近 20 条消息）
  if (chatMessages.length > 20) {
    chatMessages = chatMessages.slice(-20)
  }

  const sid = typeof sessionId === 'string' && sessionId ? sessionId : `anon_${Date.now()}`
  const startTime = Date.now()

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  let fullReply = ''
  let status: 'success' | 'error' | 'aborted' = 'success'

  try {
    const stream = await XiaohuiService.chatStream(chatMessages)

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
          const delta = chunk.choices?.[0]?.delta?.content
          if (delta) {
            // 过滤敏感内容
            const safeContent = XiaohuiService.sanitizeResponse(delta)
            fullReply += safeContent
            res.write(`data: ${JSON.stringify({ token: safeContent })}\n\n`)
          }
          // 非流式 finish_reason
          if (chunk.choices?.[0]?.finish_reason) {
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
      status
    ).catch(() => {})
  }
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
