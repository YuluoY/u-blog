import request from './request'
import type { BackendResponse } from './request'

export interface ChatReply {
  reply: string
}

export async function sendChatMessage(message: string): Promise<string> {
  const res = await request.post<BackendResponse<ChatReply>>('/chat', { message })
  const payload = res.data
  if (payload.code !== 0) {
    throw new Error(payload.message || '请求失败')
  }
  return (payload.data as ChatReply).reply
}
