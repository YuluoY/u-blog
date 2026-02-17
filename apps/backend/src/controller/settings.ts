import type { Request, Response } from 'express'
import { tryit } from '@u-blog/utils'
import { formatResponse, toResponse } from '@/utils'
import * as SettingsService from '@/service/settings'

/**
 * GET /settings?keys=key1,key2
 * 返回 { key1: { value, desc?, masked? }, ... }
 */
export async function getSettings(req: Request, res: Response): Promise<void> {
  const keysParam = (req.query.keys as string) || ''
  const keys = keysParam ? keysParam.split(',').map(k => k.trim()).filter(Boolean) : undefined
  const result = await tryit<Record<string, { value: unknown; desc?: string | null; masked?: boolean }>, Error>(
    () => SettingsService.getSettings(req, keys)
  )
  const data = formatResponse(result, 'ok', '获取设置失败')
  toResponse(data, res)
}

/**
 * PUT /settings
 * body: { [key: string]: { value: unknown, desc?: string } } 或 { key, value, desc? } 单条
 * 支持单条或批量
 */
export async function putSettings(req: Request, res: Response): Promise<void> {
  const body = req.body || {}
  let record: Record<string, { value: unknown; desc?: string }>
  if (body.key !== undefined && body.value !== undefined) {
    record = { [String(body.key)]: { value: body.value, desc: body.desc } }
  } else if (typeof body === 'object' && !Array.isArray(body) && body.settings) {
    const arr = body.settings as Array<{ key: string; value: unknown; desc?: string }>
    record = {}
    for (const item of arr) {
      if (item?.key) record[item.key] = { value: item.value, desc: item.desc }
    }
  } else {
    record = {}
    for (const [k, v] of Object.entries(body)) {
      if (k === 'settings' || k === 'key' || k === 'value' || k === 'desc') continue
      if (v !== null && typeof v === 'object' && 'value' in v) {
        record[k] = { value: (v as any).value, desc: (v as any).desc }
      } else {
        record[k] = { value: v }
      }
    }
  }
  const result = await tryit<void, Error>(() => SettingsService.setSettings(req, record))
  const data = formatResponse(result, '保存成功', '保存设置失败')
  toResponse(data, res)
}
