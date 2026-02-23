import { restQuery, restDel } from '../../shared/api/rest'

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

/** 查询对话日志列表（分页） */
export async function queryConversations(params: {
  take?: number
  skip?: number
  status?: string
  sessionId?: string
} = {}) {
  const where: Record<string, unknown> = {}
  if (params.status) where.status = params.status
  if (params.sessionId) where.sessionId = params.sessionId

  return restQuery<XiaohuiConversationItem[]>(MODEL, {
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
