import { useQuery } from '@tanstack/react-query'
import {
  fetchSiteOverview,
  fetchTrafficOverview,
  fetchTrends,
  fetchRecentArticles,
  fetchRecentComments,
  fetchPendingFriendLinks,
  fetchUserCount,
} from './api'

/** 查询键 */
const KEYS = {
  site: ['dashboard', 'site-overview'] as const,
  traffic: ['dashboard', 'traffic'] as const,
  trends: (days: number) => ['dashboard', 'trends', days] as const,
  recentArticles: ['dashboard', 'recent-articles'] as const,
  recentComments: ['dashboard', 'recent-comments'] as const,
  pendingLinks: ['dashboard', 'pending-links'] as const,
  userCount: ['dashboard', 'user-count'] as const,
}

/** 站点概览统计 */
export function useSiteOverview() {
  return useQuery({
    queryKey: KEYS.site,
    queryFn: fetchSiteOverview,
  })
}

/** 今日流量概览 */
export function useTrafficOverview() {
  return useQuery({
    queryKey: KEYS.traffic,
    queryFn: fetchTrafficOverview,
    refetchInterval: 60_000,
  })
}

/** PV/UV 趋势 */
export function useTrends(days: number = 7) {
  return useQuery({
    queryKey: KEYS.trends(days),
    queryFn: () => fetchTrends(days),
  })
}

/** 最近文章 */
export function useRecentArticles() {
  return useQuery({
    queryKey: KEYS.recentArticles,
    queryFn: fetchRecentArticles,
  })
}

/** 最近评论 */
export function useRecentComments() {
  return useQuery({
    queryKey: KEYS.recentComments,
    queryFn: fetchRecentComments,
  })
}

/** 待审友链 */
export function usePendingFriendLinks() {
  return useQuery({
    queryKey: KEYS.pendingLinks,
    queryFn: fetchPendingFriendLinks,
  })
}

/** 用户总数 */
export function useUserCount() {
  return useQuery({
    queryKey: KEYS.userCount,
    queryFn: fetchUserCount,
  })
}
