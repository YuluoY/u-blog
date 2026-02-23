import { restQuery, restAdd, restUpdate, restDel } from '../../shared/api/rest'
import { apiClient } from '../../shared/api/client'
import type { BackendResponse } from '../../shared/api/types'

/** 友链项 */
export interface FriendLinkItem {
  id: number
  userId: number
  url: string
  title: string
  icon?: string | null
  description?: string | null
  email?: string | null
  status: string
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

const MODEL = 'friend_link'

/** 查询友链列表 */
export async function queryFriendLinks(params: { take?: number; skip?: number } = {}) {
  return restQuery<FriendLinkItem[]>(MODEL, {
    take: params.take ?? 200,
    skip: params.skip ?? 0,
    order: { sortOrder: 'DESC', createdAt: 'DESC' },
  })
}

/** 新增友链 */
export async function addFriendLink(body: Partial<FriendLinkItem>) {
  return restAdd<FriendLinkItem>(MODEL, body as Record<string, unknown>)
}

/** 更新友链 */
export async function updateFriendLink(id: number, body: Partial<FriendLinkItem>) {
  return restUpdate<FriendLinkItem>(MODEL, id, body as Record<string, unknown>)
}

/** 删除友链 */
export async function deleteFriendLink(id: number) {
  return restDel(MODEL, id)
}

/** 审核友链（调用专用审核接口） */
export async function reviewFriendLink(id: number, status: 'approved' | 'rejected') {
  const res = await apiClient.put<BackendResponse<FriendLinkItem>>(`/friend-links/${id}/review`, { status })
  return res.data.data
}
