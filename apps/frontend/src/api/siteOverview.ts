import request from './request'
import type { BackendResponse } from './request'

/** GET /site-overview 返回的网站概览数据 */
export interface SiteOverviewData {
  articleCount: number
  categoryCount: number
  tagCount: number
  totalViews: number
  totalLikes: number
  totalComments: number
  runningDays: number
  lastUpdate: string
}

/**
 * 获取网站概览统计（文章/分类/标签数、浏览/点赞/评论、运行天数、最后更新）
 */
export async function getSiteOverview(): Promise<SiteOverviewData> {
  const res = await request.get<BackendResponse<SiteOverviewData>>('/site-overview')
  const payload = res.data
  if (payload.code !== 0) {
    throw new Error(payload.message || '获取网站概览失败')
  }
  return (payload.data ?? {}) as SiteOverviewData
}
