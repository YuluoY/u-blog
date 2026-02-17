import type { Repository } from 'typeorm'
import type { Request } from 'express'
import { getDataSource } from '@/utils'
import { Setting } from '@/module/schema/Setting'
import { In } from 'typeorm'

/** 需脱敏的 key（返回时只展示前几位 + ***） */
const MASK_KEYS = new Set([
  'openai_api_key',
  'openai_base_url',
  'anthropic_api_key',
  'api_key'
])

function maskValue(val: unknown): string {
  if (typeof val !== 'string') return '***'
  if (val.length <= 6) return '***'
  return `${val.slice(0, 4)}***`
}

export interface SettingItem {
  key: string
  value: unknown
  desc?: string | null
  masked?: boolean
}

/**
 * 按 key 列表查询设置，返回 key -> { value, desc?, masked? }
 * 不传 keys 时返回全部
 */
export async function getSettings(
  req: Request,
  keys?: string[]
): Promise<Record<string, { value: unknown; desc?: string | null; masked?: boolean }>> {
  const repo = getDataSource(req).getRepository(Setting) as Repository<Setting>
  const qb = repo.createQueryBuilder('s')
  if (keys && keys.length > 0) {
    qb.andWhere('s.key IN (:...keys)', { keys })
  }
  const list = await qb.getMany()
  const out: Record<string, { value: unknown; desc?: string | null; masked?: boolean }> = {}
  for (const row of list) {
    const masked = MASK_KEYS.has(row.key)
    out[row.key] = {
      value: masked ? maskValue(row.value) : row.value,
      desc: row.desc ?? undefined,
      masked: masked ? true : undefined
    }
  }
  return out
}

/**
 * 批量 upsert 设置（按 key 存在则更新，否则插入）
 */
export async function setSettings(
  req: Request,
  record: Record<string, { value: unknown; desc?: string }>
): Promise<void> {
  const repo = getDataSource(req).getRepository(Setting) as Repository<Setting>
  for (const [key, { value, desc }] of Object.entries(record)) {
    const existing = await repo.findOne({ where: { key } })
    if (existing) {
      existing.value = value
      if (desc !== undefined) existing.desc = desc
      await repo.save(existing)
    } else {
      const entity = repo.create({ key, value, desc: desc ?? null })
      await repo.save(entity)
    }
  }
}
