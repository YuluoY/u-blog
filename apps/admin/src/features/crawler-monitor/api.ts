import { apiClient } from '../../shared/api/client'
import type { BackendResponse } from '../../shared/api/types'

export interface CrawlerOverview {
  totalVisits: number
  todayVisits: number
  uniqueBots: number
  uniquePaths: number
  lastVisitAt: string | null
  topBots: Array<{ bot: string; count: number }>
}

export interface CrawlerLogItem {
  id: number
  bot: string
  ip: string | null
  location: string | null
  path: string | null
  url: string | null
  cacheHit: boolean
  statusCode: number | null
  renderMs: number | null
  htmlBytes: number | null
  userAgent: string | null
  createdAt: string
}

export interface CrawlerLogResult {
  list: CrawlerLogItem[]
  total: number
  page: number
  pageSize: number
}

export interface CrawlerLogParams {
  page?: number
  pageSize?: number
  bot?: string
  path?: string
}

export async function fetchCrawlerOverview() {
  const res = await apiClient.get<BackendResponse<CrawlerOverview>>('/seo/monitor/crawlers/overview')
  return res.data.data
}

export async function fetchCrawlerLogs(params: CrawlerLogParams = {}) {
  const res = await apiClient.get<BackendResponse<CrawlerLogResult>>('/seo/monitor/crawlers/logs', { params })
  return res.data.data
}
