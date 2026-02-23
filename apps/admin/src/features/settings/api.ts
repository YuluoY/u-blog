import { restQuery, restUpdate } from '../../shared/api/rest'
import { apiClient } from '../../shared/api/client'
import type { BackendResponse } from '../../shared/api/types'

export interface SettingItem {
  id: number
  key: string
  value: unknown
  desc?: string | null
  routeId?: number | null
  createdAt?: string
  updatedAt?: string
}

/** 单条设置值（来自 GET /settings） */
export interface SettingValue {
  value: unknown
  desc?: string | null
  masked?: boolean
}

/** GET /settings 返回的 map */
export type SettingsMap = Record<string, SettingValue>

const MODEL = 'setting'

export async function querySettings(params: { take?: number; skip?: number } = {}) {
  return restQuery<SettingItem[]>(MODEL, {
    take: params.take ?? 200,
    skip: params.skip ?? 0,
    order: { id: 'ASC' },
  })
}

export async function updateSetting(id: number, body: { value?: unknown; desc?: string }) {
  return restUpdate<SettingItem>(MODEL, id, body)
}

/**
 * 通过专用 /settings 接口获取设置（支持按 keys 过滤）
 */
export async function getSettingsByKeys(keys?: string[]): Promise<SettingsMap> {
  const params = keys?.length ? { keys: keys.join(',') } : {}
  const res = await apiClient.get<BackendResponse<SettingsMap>>('/settings', { params })
  return (res.data.data ?? {}) as SettingsMap
}

/**
 * 通过专用 /settings 接口批量保存设置（自动 upsert）
 */
export async function saveSettings(
  record: Record<string, { value: unknown; desc?: string }>
): Promise<void> {
  await apiClient.put<BackendResponse<unknown>>('/settings', record)
}
