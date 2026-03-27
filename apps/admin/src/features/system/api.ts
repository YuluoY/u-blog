/**
 * 系统管理 API
 */
import { apiClient } from '../../shared/api/client'
import type { BackendResponse } from '../../shared/api/types'

/* ============ 类型定义 ============ */

export interface SystemMetrics {
  cpuUsage: number
  cpuCores: number
  cpuModel: string
  memTotal: number
  memUsed: number
  memUsage: number
  diskTotal: number
  diskUsed: number
  diskUsage: number
  uptime: number
  platform: string
  hostname: string
  nodeVersion: string
  loadAvg: number[]
  networkInterfaces: { name: string; address: string; family: string }[]
}

export interface RedisInfo {
  connected: boolean
  version?: string
  usedMemory?: string
  usedMemoryPeak?: string
  connectedClients?: number
  totalKeys?: number
  uptime?: number
  hitRate?: string
}

export interface NginxStatus {
  running: boolean
  version?: string
  configTest?: string
  workerProcesses?: number
}

/** PM2 进程信息 */
export interface Pm2Process {
  pm_id: number
  name: string
  status: string
  cpu: number
  memory: number
  uptime: number
  restarts: number
  pid: number
}

export interface DataCounterArticleDrift {
  id: number
  title: string
  storedLikeCount: number
  actualLikeCount: number
  storedCommentCount: number
  actualCommentCount: number
}

export interface DataCounterCommentDrift {
  id: number
  articleId: number | null
  storedLikeCount: number
  actualLikeCount: number
}

export interface DataCounterAudit {
  sitePageViews: number
  siteUniqueVisitors: number
  siteLikeTotal: number
  siteCommentVisibleTotal: number
  siteStandaloneCommentVisibleTotal: number
  siteDeletedCommentTotal: number
  articleLikeStoredTotal: number
  articleLikeActualTotal: number
  articleCommentStoredTotal: number
  articleCommentActualTotal: number
  commentLikeStoredTotal: number
  commentLikeActualTotal: number
  driftArticleCount: number
  driftCommentCount: number
  driftArticles: DataCounterArticleDrift[]
  driftComments: DataCounterCommentDrift[]
  articleViewCountNote: string
}

export interface DataCounterRepairResult {
  repairedArticleLikeRows: number
  repairedArticleCommentRows: number
  repairedCommentLikeRows: number
  audit: DataCounterAudit
}

export interface BackupArtifact {
  name: string
  size: number
  createdAt: string
  updatedAt: string
  tableCount: number
  totalRows: number
  includesUploads: boolean
  includesStatic: boolean
}

/* ============ API 请求 ============ */

export async function fetchMetrics(): Promise<SystemMetrics> {
  const res = await apiClient.get<BackendResponse<SystemMetrics>>('/system/metrics')
  return res.data.data
}

export async function fetchRedisInfo(): Promise<RedisInfo> {
  const res = await apiClient.get<BackendResponse<RedisInfo>>('/system/redis')
  return res.data.data
}

export async function flushRedis(): Promise<{ success: boolean }> {
  const res = await apiClient.post<BackendResponse<{ success: boolean }>>('/system/redis/flush')
  return res.data.data
}

export async function fetchNginxStatus(): Promise<NginxStatus> {
  const res = await apiClient.get<BackendResponse<NginxStatus>>('/system/nginx')
  return res.data.data
}

export async function reloadNginx(): Promise<{ success: boolean; message: string }> {
  const res = await apiClient.post<BackendResponse<{ success: boolean; message: string }>>('/system/nginx/reload')
  return res.data.data
}

export async function fetchPm2List(): Promise<Pm2Process[]> {
  const res = await apiClient.get<BackendResponse<Pm2Process[]>>('/system/pm2')
  return res.data.data
}

export async function restartBackend(): Promise<{ success: boolean; message: string }> {
  const res = await apiClient.post<BackendResponse<{ success: boolean; message: string }>>('/system/pm2/restart')
  return res.data.data
}

export async function fetchPm2Logs(name: string, lines = 200): Promise<string> {
  const res = await apiClient.get<BackendResponse<{ logs: string }>>('/system/pm2/logs', { params: { name, lines } })
  return res.data.data.logs
}

export async function deployUpload(file: File, target: string): Promise<{ target: string; deployDir: string }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('target', target)
  const res = await apiClient.post<BackendResponse<{ target: string; deployDir: string }>>('/system/deploy', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120_000, // 部署可能较慢
  })
  return res.data.data
}

/* ============ 数据审计 / 备份导出 ============ */

export async function fetchDataCounterAudit(): Promise<DataCounterAudit> {
  const res = await apiClient.get<BackendResponse<DataCounterAudit>>('/system/data/counters')
  return res.data.data
}

export async function repairDataCounters(): Promise<DataCounterRepairResult> {
  const res = await apiClient.post<BackendResponse<DataCounterRepairResult>>('/system/data/counters/repair')
  return res.data.data
}

export async function fetchBackups(): Promise<BackupArtifact[]> {
  const res = await apiClient.get<BackendResponse<BackupArtifact[]>>('/system/backups')
  return res.data.data
}

export async function createBackup(): Promise<BackupArtifact> {
  const res = await apiClient.post<BackendResponse<BackupArtifact>>('/system/backups')
  return res.data.data
}

export async function downloadBackup(name: string): Promise<Blob> {
  const res = await apiClient.get<Blob>('/system/backups/download', {
    params: { name },
    responseType: 'blob',
    skipGlobalError: true,
    timeout: 120_000, // 备份文件可能较大，延长超时
  })
  return res.data
}
