import request from './request'
import type { BackendResponse } from './request'
import type { IFriendLink } from '@u-blog/model'

/** 获取某用户的已审核友链列表 */
export async function getFriendLinks(userId: number): Promise<IFriendLink[]> {
  const res = await request.get<BackendResponse<IFriendLink[]>>('/friend-links', { params: { userId } })
  if (res.data.code !== 0) throw new Error(res.data.message || '获取友链失败')
  return res.data.data ?? []
}

/** 获取当前登录用户的全部友链（管理用） */
export async function getMyFriendLinks(): Promise<IFriendLink[]> {
  const res = await request.get<BackendResponse<IFriendLink[]>>('/friend-links/manage')
  if (res.data.code !== 0) throw new Error(res.data.message || '获取友链失败')
  return res.data.data ?? []
}

/** 提交友链申请 */
export async function submitFriendLink(data: {
  userId: number
  url: string
  title: string
  icon?: string
  description?: string
  email?: string
}): Promise<IFriendLink> {
  const res = await request.post<BackendResponse<IFriendLink>>('/friend-links', data)
  if (res.data.code !== 0) throw new Error(res.data.message || '提交友链失败')
  return res.data.data
}

/** 审核友链 */
export async function reviewFriendLink(id: number, action: 'approve' | 'reject'): Promise<IFriendLink> {
  const res = await request.put<BackendResponse<IFriendLink>>(`/friend-links/${id}/review`, { action })
  if (res.data.code !== 0) throw new Error(res.data.message || '审核失败')
  return res.data.data
}

/** 更新友链排序 */
export async function updateFriendLinkSort(id: number, sortOrder: number): Promise<IFriendLink> {
  const res = await request.put<BackendResponse<IFriendLink>>(`/friend-links/${id}/sort`, { sortOrder })
  if (res.data.code !== 0) throw new Error(res.data.message || '更新排序失败')
  return res.data.data
}

/** 删除友链 */
export async function deleteFriendLink(id: number): Promise<void> {
  const res = await request.delete<BackendResponse<unknown>>(`/friend-links/${id}`)
  if (res.data.code !== 0) throw new Error(res.data.message || '删除失败')
}

/** 抓取站点 meta 信息（自动填充友链表单） */
export async function fetchSiteMeta(url: string): Promise<{ title: string; icon: string; description: string }> {
  const res = await request.get<BackendResponse<{ title: string; icon: string; description: string }>>('/fetch-site-meta', { params: { url } })
  if (res.data.code !== 0) throw new Error(res.data.message || '抓取站点信息失败')
  return res.data.data
}
