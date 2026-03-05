import request from './request'
import type { BackendResponse } from './request'
import type { IUser } from '@u-blog/model'

/** 用户博客公开资料 */
export interface UserBlogProfile {
  user: Partial<IUser>
  settings: Record<string, unknown>
  stats: { articleCount: number; totalViews: number; totalLikes: number }
}

/** 获取用户博客公开资料 */
export async function getUserBlogProfile(username: string): Promise<UserBlogProfile>
{
  const res = await request.get<BackendResponse<UserBlogProfile>>(`/u/${encodeURIComponent(username)}`)
  if (res.data.code !== 0) throw new Error(res.data.message || '获取用户信息失败')
  return res.data.data
}

/** 获取站长（super_admin）公开资料 — 游客侧栏展示用，无需认证 */
export async function getSiteOwnerProfile(): Promise<UserBlogProfile | null>
{
  const res = await request.get<BackendResponse<UserBlogProfile>>('/site-owner')
  if (res.data.code !== 0) return null
  return res.data.data
}
