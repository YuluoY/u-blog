import request from './request'
import type { BackendResponse } from './request'

/** 单条设置的返回值（敏感项带 masked） */
export interface SettingItem {
  value: unknown
  desc?: string | null
  masked?: boolean
}

/** GET /settings 返回：key -> SettingItem */
export type SettingsMap = Record<string, SettingItem>

/** 同参数并发请求共用一个 promise，减少重复请求 */
const getSettingsCache = new Map<string, Promise<SettingsMap>>()

/**
 * 获取站点设置（不传 keys 则拉取全部）。相同 keys 的并发调用会共用一个请求。
 */
export async function getSettings(keys?: string[]): Promise<SettingsMap> {
  const cacheKey = keys?.length ? keys.slice().sort().join(',') : '__all__'
  let p = getSettingsCache.get(cacheKey)
  if (!p) {
    p = (async () => {
      const params = keys?.length ? { keys: keys.join(',') } : {}
      const res = await request.get<BackendResponse<SettingsMap>>('/settings', { params })
      const payload = res.data
      if (payload.code !== 0) {
        throw new Error(payload.message || '获取设置失败')
      }
      return (payload.data ?? {}) as SettingsMap
    })()
    getSettingsCache.set(cacheKey, p)
    p.finally(() => getSettingsCache.delete(cacheKey))
  }
  return p
}

/**
 * 更新站点设置（单条或批量）
 */
export async function updateSettings(
  record: Record<string, { value: unknown; desc?: string }>
): Promise<void> {
  const res = await request.put<BackendResponse<unknown>>('/settings', record)
  const payload = res.data
  if (payload.code !== 0) {
    throw new Error(payload.message || '保存设置失败')
  }
}
