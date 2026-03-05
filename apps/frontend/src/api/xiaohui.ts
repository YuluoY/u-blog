/** 小惠 AI 助手 API 模块 */
import { getAccessToken } from './request'

/** 小惠对话消息格式 */
export interface XiaohuiMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

/** SSE 事件数据类型 */
interface SSETokenEvent { token: string }
interface SSEDoneEvent { done: true }
interface SSEErrorEvent { error: string }
type SSEEvent = SSETokenEvent | SSEDoneEvent | SSEErrorEvent

/**
 * 向小惠发送消息并以 SSE 流式接收回复
 * @param messages    对话历史
 * @param sessionId   会话 ID（用于日志关联）
 * @param onToken     每接收到一个 token 片段时的回调
 * @param signal      AbortController.signal，用于取消请求
 * @returns 完整的回复文本
 */
export async function sendXiaohuiStream(
  messages: XiaohuiMessage[],
  sessionId: string,
  onToken: (token: string) => void,
  signal?: AbortSignal,
): Promise<string>
{
  // 携带 JWT token（已登录用户）
  const token = getAccessToken()

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch('/api/xiaohui/chat', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ messages, sessionId }),
    signal,
  })

  // 非 SSE 响应（如 JSON 错误）
  if (!res.ok || !res.body)
  {
    let msg = `HTTP ${res.status}`
    try
    {
      const json = await res.json()
      msg = json.message || msg
    }
    catch
    { /* ignore */ }
    throw new Error(msg)
  }

  // 后端校验失败可能返回 200 + application/json
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json'))
  {
    let msg = 'Unknown error'
    try
    {
      const json = await res.json()
      msg = json.message || msg
    }
    catch
    { /* ignore */ }
    throw new Error(msg)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullText = ''

  for (;;)
  {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    const parts = buffer.split('\n\n')
    buffer = parts.pop() || ''

    for (const part of parts)
    {
      const line = part.trim()
      if (!line.startsWith('data: ')) continue
      const jsonStr = line.slice(6)

      try
      {
        const evt: SSEEvent = JSON.parse(jsonStr)
        if ('error' in evt) throw new Error(evt.error)
        if ('done' in evt) continue
        if ('token' in evt)
        {
          fullText += evt.token
          onToken(evt.token)
        }
      }
      catch (e)
      {
        if (e instanceof Error && e.message !== jsonStr) throw e
      }
    }
  }

  return fullText
}

/**
 * 检查小惠服务状态
 */
export async function getXiaohuiStatus(): Promise<{ available: boolean; message: string }>
{
  try
  {
    const res = await fetch('/api/xiaohui/status')
    const json = await res.json()
    return json.data || { available: false, message: '服务不可用' }
  }
  catch
  {
    return { available: false, message: '网络连接失败' }
  }
}
