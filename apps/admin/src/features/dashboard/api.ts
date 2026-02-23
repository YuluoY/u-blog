import { apiClient } from '../../shared/api/client'
import { restQuery } from '../../shared/api/rest'
import type { BackendResponse } from '../../shared/api/types'

/* ---------- 站点概览（后端聚合接口，高效） ---------- */

export interface SiteOverview {
  articleCount: number
  categoryCount: number
  tagCount: number
  totalViews: number
  totalLikes: number
  totalComments: number
  runningDays: number
  lastUpdate: string
}

/** 获取站点概览统计 */
export async function fetchSiteOverview(): Promise<SiteOverview> {
  const res = await apiClient.get<BackendResponse<SiteOverview>>('/site-overview')
  return res.data.data
}

/* ---------- 流量概览 ---------- */

export interface TrafficOverview {
  todayPv: number
  todayUv: number
  totalPv: number
  totalUv: number
  todayNewUsers: number
  avgDuration: number
}

/** 获取今日流量概览 */
export async function fetchTrafficOverview(): Promise<TrafficOverview> {
  const res = await apiClient.get<BackendResponse<TrafficOverview>>('/activity/stats/overview')
  return res.data.data
}

/* ---------- 7 天趋势 ---------- */

export interface TrendPoint {
  date: string
  pv: number
  uv: number
}

/** 获取最近 N 天 PV/UV 趋势 */
export async function fetchTrends(days: number = 7): Promise<TrendPoint[]> {
  const res = await apiClient.get<BackendResponse<TrendPoint[]>>('/activity/stats/trends', {
    params: { days },
  })
  return res.data.data
}

/* ---------- 最近文章 ---------- */

export interface RecentArticle {
  id: number
  title: string
  status: string
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
}

/** 获取最近 5 篇文章 */
export async function fetchRecentArticles(): Promise<RecentArticle[]> {
  return restQuery<RecentArticle[]>('article', {
    take: 5,
    order: { createdAt: 'DESC' },
  })
}

/* ---------- 最近评论 ---------- */

export interface RecentComment {
  id: number
  content: string
  nickname?: string
  email?: string
  createdAt: string
  articleId?: number
}

/** 获取最近 5 条评论 */
export async function fetchRecentComments(): Promise<RecentComment[]> {
  return restQuery<RecentComment[]>('comment', {
    take: 5,
    order: { createdAt: 'DESC' },
  })
}

/* ---------- 待审友链 ---------- */

export interface PendingFriendLink {
  id: number
  title: string
  url: string
  icon?: string
  description?: string
  email?: string
  status: string
  createdAt: string
}

/** 获取待审核友链 */
export async function fetchPendingFriendLinks(): Promise<PendingFriendLink[]> {
  return restQuery<PendingFriendLink[]>('friend_link', {
    where: { status: 'pending' },
    take: 10,
    order: { createdAt: 'DESC' },
  })
}

/* ---------- 用户计数 ---------- */

/** 获取用户总数 */
export async function fetchUserCount(): Promise<number> {
  const list = await restQuery<{ id: number }[]>('users', { take: 10000 })
  return Array.isArray(list) ? list.length : 0
}
