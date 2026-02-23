/** 前端传给后端的消息格式 */
export interface ChatMessagePayload {
  role: 'user' | 'assistant'
  content: string
}

/** 聊天模型参数（温度、最大输出等），传给后端覆盖全局配置 */
export interface ChatModelConfig {
  temperature?: number
  maxTokens?: number
}

/** SSE 事件数据类型 */
interface SSETokenEvent { token: string }
interface SSEDoneEvent  { done: true }
interface SSEErrorEvent { error: string }
type SSEEvent = SSETokenEvent | SSEDoneEvent | SSEErrorEvent

/**
 * 发送聊天消息并以 SSE 流式接收回复
 * @param messages     完整对话历史
 * @param onToken      每接收到一个 token 片段时的回调
 * @param signal       AbortController.signal，用于取消请求
 * @param config       可选的模型参数覆盖（温度、最大输出等）
 * @param ragContext   可选的 RAG 检索上下文，由后端注入系统提示词
 * @param blogOwnerId  子域名游客场景下博主的 userId，后端据此加载博主的模型配置
 * @returns 完整的回复文本
 */
export async function sendChatMessageStream(
  messages: ChatMessagePayload[],
  onToken: (token: string) => void,
  signal?: AbortSignal,
  config?: ChatModelConfig,
  ragContext?: string,
  blogOwnerId?: number,
): Promise<string> {
  // 从 request 模块获取内存中的 access token，确保鉴权与 axios 实例一致
  const { getAccessToken } = await import('./request')
  const token = getAccessToken()

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({
      messages,
      ...(config ? { config } : {}),
      ...(ragContext ? { context: ragContext } : {}),
      ...(blogOwnerId ? { blogOwnerId } : {}),
    }),
    signal,
  })

  // 非 SSE 响应（如 JSON 错误）
  if (!res.ok || !res.body) {
    let msg = `HTTP ${res.status}`
    try {
      const json = await res.json()
      msg = json.message || msg
    } catch { /* ignore */ }
    throw new Error(msg)
  }

  // 后端在输入校验失败时可能返回 200 + application/json 而非 SSE
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    let msg = 'Unknown error'
    try {
      const json = await res.json()
      msg = json.message || msg
    } catch { /* ignore */ }
    throw new Error(msg)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullText = ''

  // 逐块读取 SSE 流
  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // SSE 格式：以 \n\n 分割事件
    const parts = buffer.split('\n\n')
    // 最后一段可能不完整，留在 buffer
    buffer = parts.pop() || ''

    for (const part of parts) {
      // 提取 "data: {...}" 行
      const line = part.trim()
      if (!line.startsWith('data: ')) continue
      const jsonStr = line.slice(6)

      try {
        const evt: SSEEvent = JSON.parse(jsonStr)
        if ('error' in evt) throw new Error(evt.error)
        if ('done' in evt) continue
        if ('token' in evt) {
          fullText += evt.token
          onToken(evt.token)
        }
      } catch (e) {
        if (e instanceof Error && e.message !== jsonStr) throw e
      }
    }
  }

  return fullText
}
