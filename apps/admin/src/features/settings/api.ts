import { restQuery, restUpdate } from '../../shared/api/rest'

export interface SettingItem {
  id: number
  key: string
  value: unknown
  desc?: string | null
  routeId?: number | null
  createdAt?: string
  updatedAt?: string
}

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
