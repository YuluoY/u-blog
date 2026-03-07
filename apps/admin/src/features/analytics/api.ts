import { apiClient } from '../../shared/api/client'
import type { BackendResponse } from '../../shared/api/types'

/** 统计概览 */
export interface AnalyticsOverview {
  todayPv: number
  todayUv: number
  totalPv: number
  totalUv: number
  todayNewUsers: number
  avgDuration: number
}

/** 趋势数据点 */
export interface AnalyticsTrend {
  date: string
  pv: number
  uv: number
}

/** 页面排行 */
export interface PageRank {
  path: string
  pv: number
  uv: number
  avgDuration: number
}

/** 地域分布 */
export interface GeoDistribution {
  location: string
  count: number
}

/** 浏览器/设备分布项 */
export interface DeviceDistribution {
  name: string
  count: number
}

/** 统计概览 */
export async function fetchOverview() {
  const res = await apiClient.get<BackendResponse<AnalyticsOverview>>('/activity/stats/overview')
  return res.data.data
}

/** PV/UV 趋势 */
export async function fetchTrends(days: number = 30) {
  const res = await apiClient.get<BackendResponse<AnalyticsTrend[]>>('/activity/stats/trends', {
    params: { days },
  })
  return res.data.data
}

/** 页面排行 */
export async function fetchPageRanks(limit: number = 20) {
  const res = await apiClient.get<BackendResponse<PageRank[]>>('/activity/stats/pages', {
    params: { limit },
  })
  return res.data.data
}

/** 地域分布 */
export async function fetchGeoDistribution(limit: number = 20) {
  const res = await apiClient.get<BackendResponse<GeoDistribution[]>>('/activity/stats/geo', {
    params: { limit },
  })
  return res.data.data
}

/** 设备/浏览器/OS 分布 */
export interface DeviceStats {
  browsers: DeviceDistribution[]
  devices: DeviceDistribution[]
  os: DeviceDistribution[]
}
export async function fetchDeviceStats(limit: number = 10) {
  const res = await apiClient.get<BackendResponse<DeviceStats>>('/activity/stats/devices', {
    params: { limit },
  })
  return res.data.data
}

/** 行为日志列表 */
export interface LogListParams {
  page?: number
  pageSize?: number
  type?: string
  excludeType?: string
  ip?: string
  path?: string
  userId?: number
  startDate?: string
  endDate?: string
}

export interface LogListResult {
  list: Array<{
    id: number
    type: string
    userId: number | null
    sessionId: string | null
    ip: string | null
    location: string | null
    browser: string | null
    device: string | null
    os: string | null
    path: string | null
    referer: string | null
    metadata: Record<string, unknown> | null
    duration: number | null
    createdAt: string
    user: { id: number; username: string; namec: string } | null
  }>
  total: number
  page: number
  pageSize: number
}

export async function fetchLogs(params: LogListParams = {}) {
  const res = await apiClient.get<BackendResponse<LogListResult>>('/activity/logs', { params })
  return res.data.data
}

/** 按 IP 清理行为日志 */
export async function clearLogsByIp(ip: string) {
  const res = await apiClient.delete<BackendResponse<{ deleted: number }>>('/activity/logs/by-ip', {
    data: { ip },
  })
  return res.data.data
}
