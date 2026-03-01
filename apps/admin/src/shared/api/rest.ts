import { apiClient } from './client'
import type { BackendResponse } from './types'

export interface RestQueryBody {
  where?: Record<string, unknown>
  take?: number
  skip?: number
  order?: Record<string, 'ASC' | 'DESC'>
  relations?: string[]
  withCount?: boolean
}

/** 分页查询返回结构 */
export interface PagedResult<T> {
  list: T[]
  total: number
}

export async function restQuery<T = unknown>(
  model: string,
  body: RestQueryBody = {}
): Promise<T> {
  const res = await apiClient.post<BackendResponse<T>>(`/rest/${model}/query`, body)
  const payload = res.data
  return payload.data as T
}

/** 带总数的分页查询 */
export async function restQueryPaged<T = unknown>(
  model: string,
  body: Omit<RestQueryBody, 'withCount'> = {}
): Promise<PagedResult<T>> {
  const res = await apiClient.post<BackendResponse<PagedResult<T>>>(`/rest/${model}/query`, {
    ...body,
    withCount: true,
  })
  const payload = res.data
  return payload.data as PagedResult<T>
}

export async function restAdd<T = unknown>(
  model: string,
  body: Record<string, unknown> = {}
): Promise<T> {
  const res = await apiClient.post<BackendResponse<T>>(`/rest/${model}/add`, body)
  return res.data.data as T
}

export async function restUpdate<T = unknown>(
  model: string,
  id: number,
  body: Record<string, unknown> = {}
): Promise<T> {
  const res = await apiClient.put<BackendResponse<T>>(`/rest/${model}/update`, {
    id,
    ...body,
  })
  return res.data.data as T
}

export async function restDel(model: string, id: number): Promise<void> {
  await apiClient.delete<BackendResponse<unknown>>(`/rest/${model}/del`, {
    data: { id },
  })
}
