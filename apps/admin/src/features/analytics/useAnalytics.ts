import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  fetchOverview,
  fetchTrends,
  fetchPageRanks,
  fetchGeoDistribution,
  fetchDeviceStats,
  fetchLogs,
  type LogListParams,
} from './api'

/** 查询键前缀 */
const KEYS = {
  overview: ['analytics', 'overview'] as const,
  trends: (days: number) => ['analytics', 'trends', days] as const,
  pages: (limit: number) => ['analytics', 'pages', limit] as const,
  geo: (limit: number) => ['analytics', 'geo', limit] as const,
  devices: (limit: number) => ['analytics', 'devices', limit] as const,
  logs: (params: LogListParams) => ['analytics', 'logs', params] as const,
}

export function useOverview() {
  return useQuery({
    queryKey: KEYS.overview,
    queryFn: fetchOverview,
    refetchInterval: 60_000,
  })
}

export function useTrends(days: number = 30) {
  return useQuery({
    queryKey: KEYS.trends(days),
    queryFn: () => fetchTrends(days),
  })
}

export function usePageRanks(limit: number = 20) {
  return useQuery({
    queryKey: KEYS.pages(limit),
    queryFn: () => fetchPageRanks(limit),
  })
}

export function useGeoDistribution(limit: number = 20) {
  return useQuery({
    queryKey: KEYS.geo(limit),
    queryFn: () => fetchGeoDistribution(limit),
  })
}

export function useDeviceStats(limit: number = 10) {
  return useQuery({
    queryKey: KEYS.devices(limit),
    queryFn: () => fetchDeviceStats(limit),
  })
}

export function useActivityLogs(params: LogListParams = {}) {
  return useQuery({
    queryKey: KEYS.logs(params),
    queryFn: () => fetchLogs(params),
    placeholderData: keepPreviousData,
  })
}
