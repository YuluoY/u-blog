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

export async function fetchPm2List(): Promise<any[]> {
  const res = await apiClient.get<BackendResponse<any[]>>('/system/pm2')
  return res.data.data
}

export async function restartBackend(): Promise<{ success: boolean; message: string }> {
  const res = await apiClient.post<BackendResponse<{ success: boolean; message: string }>>('/system/pm2/restart')
  return res.data.data
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
