import { restQueryPaged, restDel } from '../../shared/api/rest'
import type { PagedResult } from '../../shared/api/rest'
import { apiClient } from '../../shared/api/client'
import type { BackendResponse } from '../../shared/api/types'

/** 小惠对话日志项 */
export interface XiaohuiConversationItem {
  id: number
  sessionId: string
  userId: number | null
  clientIp: string | null
  userMessage: string
  assistantMessage: string | null
  context: Array<{ role: string; content: string; timestamp: number }> | null
  latencyMs: number | null
  status: string
  user?: { id: number; username: string; namec?: string; avatar?: string } | null
  createdAt: string
  updatedAt: string
}

const MODEL = 'xiaohui_conversation'

/** 查询对话日志列表（分页，含总数） */
export async function queryConversations(params: {
  take?: number
  skip?: number
  status?: string
  sessionId?: string
} = {}): Promise<PagedResult<XiaohuiConversationItem>> {
  const where: Record<string, unknown> = {}
  if (params.status) where.status = params.status
  if (params.sessionId) where.sessionId = params.sessionId

  return restQueryPaged<XiaohuiConversationItem>(MODEL, {
    take: params.take ?? 50,
    skip: params.skip ?? 0,
    order: { id: 'DESC' },
    where,
    relations: ['user'],
  })
}

/** 删除对话记录 */
export async function deleteConversation(id: number) {
  return restDel(MODEL, id)
}

export interface XiaohuiIpBanItem {
  ip: string
  reason: string
  source: 'auto' | 'manual'
  createdAt: number
  until: number
  triggerCount?: number
  retryAfterSec: number
}

export async function queryXiaohuiIpGuardList(): Promise<{ list: XiaohuiIpBanItem[]; total: number }> {
  const res = await apiClient.get<BackendResponse<{ list: XiaohuiIpBanItem[]; total: number }>>('/xiaohui/ip-guard/list')
  return res.data.data || { list: [], total: 0 }
}

export async function createXiaohuiIpBan(payload: { ip: string; minutes?: number; reason?: string }) {
  const res = await apiClient.post<BackendResponse<{ ip: string; until: number }>>('/xiaohui/ip-guard/ban', payload)
  return res.data.data
}

export async function removeXiaohuiIpBan(payload: { ip: string }) {
  const res = await apiClient.post<BackendResponse<{ ip: string }>>('/xiaohui/ip-guard/unban', payload)
  return res.data.data
}
