import type { Request } from 'express'
import { getDataSource } from '@/utils'
import { XiaohuiConversation, type IXiaohuiMessage } from '@/module/schema/XiaohuiConversation'

/** OpenClaw Gateway 配置（从环境变量或硬编码） */
const OPENCLAW_URL = process.env.OPENCLAW_URL || 'http://127.0.0.1:18789'
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || 'bffd7a8a0d8afe536ede4004958b60a3ef0998f1f6024980'

/** 安全过滤：禁止返回的敏感内容关键词 */
const SENSITIVE_PATTERNS = [
  // 文件系统操作
  /(?:cat|rm|mv|cp|chmod|chown|ls|find|mkdir|rmdir|touch)\s+[\/~]/i,
  // 敏感路径
  /\/etc\/(?:passwd|shadow|hosts|nginx|ssh)/i,
  /\.env\b/i,
  /(?:api[_-]?key|secret|password|token|credential)/i,
  // 服务器信息
  /(?:127\.0\.0\.1|localhost|0\.0\.0\.0):\d+/i,
]

/** 用户输入安全过滤：拒绝危险指令 */
const DANGEROUS_INPUT_PATTERNS = [
  // 文件操作指令
  /(?:修改|删除|创建|编辑|写入|覆盖|更改|替换)\s*(?:文件|配置|服务器|系统|数据库)/i,
  /(?:modify|delete|create|edit|write|overwrite|change|replace)\s+(?:file|config|server|system|database)/i,
  // shell 命令注入
  /(?:exec|system|eval|spawn|fork|require)\s*\(/i,
  /[`$]\(.*\)/,
  // SQL 注入
  /(?:DROP|DELETE|TRUNCATE|ALTER|INSERT)\s+(?:TABLE|DATABASE|INTO)/i,
]

/**
 * 小惠 AI 助手服务
 * 代理本地 OpenClaw Gateway 的 OpenAI 兼容 HTTP API
 */
export default class XiaohuiService {

  /**
   * 流式对话 — 返回 SSE 兼容的 async generator
   * @param messages 对话历史（已过滤安全）
   * @returns OpenAI SSE stream 的 async iterable
   */
  static async chatStream(
    messages: IXiaohuiMessage[]
  ): Promise<ReadableStream<Uint8Array>> {
    const openaiMessages = messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const response = await fetch(`${OPENCLAW_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
        'x-openclaw-agent-id': 'main',
      },
      body: JSON.stringify({
        model: 'openclaw',
        messages: openaiMessages,
        stream: true,
      }),
    })

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => 'Unknown error')
      throw new Error(`OpenClaw 请求失败: ${response.status} ${text}`)
    }

    return response.body
  }

  /**
   * 非流式对话 — 返回完整回复
   */
  static async chat(messages: IXiaohuiMessage[]): Promise<string> {
    const openaiMessages = messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const response = await fetch(`${OPENCLAW_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
        'x-openclaw-agent-id': 'main',
      },
      body: JSON.stringify({
        model: 'openclaw',
        messages: openaiMessages,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenClaw 请求失败: ${response.status}`)
    }

    const data = await response.json() as any
    return data.choices?.[0]?.message?.content || ''
  }

  /**
   * 校验用户输入安全性
   * @returns null 表示安全，否则返回拒绝原因
   */
  static validateInput(message: string): string | null {
    for (const pattern of DANGEROUS_INPUT_PATTERNS) {
      if (pattern.test(message)) {
        return '抱歉，小惠不支持执行系统操作指令哦~'
      }
    }
    if (message.length > 4000) {
      return '消息太长啦，请控制在 4000 字以内~'
    }
    return null
  }

  /**
   * 过滤 AI 回复中的敏感信息
   */
  static sanitizeResponse(content: string): string {
    let result = content
    for (const pattern of SENSITIVE_PATTERNS) {
      result = result.replace(pattern, '[已过滤]')
    }
    return result
  }

  /**
   * 记录对话日志到数据库
   */
  static async logConversation(
    req: Request,
    sessionId: string,
    userMessage: string,
    assistantMessage: string | null,
    context: IXiaohuiMessage[] | null,
    latencyMs: number,
    status: 'success' | 'error' | 'aborted' = 'success'
  ): Promise<void> {
    try {
      const ds = getDataSource(req)
      const repo = ds.getRepository(XiaohuiConversation)

      const log = repo.create({
        sessionId,
        userId: (req as any).user?.id ?? null,
        clientIp: req.ip || req.socket?.remoteAddress || null,
        userMessage,
        assistantMessage,
        context,
        latencyMs,
        status,
      })

      await repo.save(log)
    } catch (err) {
      // 日志写入失败不应影响用户体验
      console.error('[xiaohui] 对话日志写入失败:', err)
    }
  }
}
