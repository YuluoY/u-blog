import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { fetchCrawlerOverview, fetchCrawlerLogs, type CrawlerLogParams } from './api'

const KEYS = {
  overview: ['crawler-monitor', 'overview'] as const,
  logs: (params: CrawlerLogParams) => ['crawler-monitor', 'logs', params] as const,
}

export function useCrawlerOverview() {
  return useQuery({
    queryKey: KEYS.overview,
    queryFn: fetchCrawlerOverview,
    refetchInterval: 60_000,
  })
}

export function useCrawlerLogs(params: CrawlerLogParams = {}) {
  return useQuery({
    queryKey: KEYS.logs(params),
    queryFn: () => fetchCrawlerLogs(params),
    placeholderData: keepPreviousData,
  })
}
