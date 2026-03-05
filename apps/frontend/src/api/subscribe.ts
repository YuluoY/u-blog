import request from './request'
import type { BackendResponse } from './request'

export interface SubscribeStats {
  total: number
  active: number
  pending: number
}

/**
 * 提交邮箱订阅
 */
export async function subscribeEmail(email: string, name?: string): Promise<string>
{
  const res = await request.post<BackendResponse<null>>('/subscribe', { email, name: name || undefined })
  const payload = res.data
  if (payload.code !== 0)
  
    throw new Error(payload.message || '订阅失败')
  
  return payload.message
}

/**
 * 获取订阅统计
 */
export async function getSubscribeStats(): Promise<SubscribeStats>
{
  const res = await request.get<BackendResponse<SubscribeStats>>('/subscribe/stats')
  const payload = res.data
  if (payload.code !== 0)
  
    throw new Error(payload.message || '获取订阅统计失败')
  
  return payload.data as SubscribeStats
}
