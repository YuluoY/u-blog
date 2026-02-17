import { apiClient } from './client'
import type { BackendResponse } from './types'

export interface RestQueryBody {
  where?: Record<string, unknown>
  take?: number
  skip?: number
  order?: Record<string, 'ASC' | 'DESC'>
  relations?: string[]
}

export async function restQuery<T = unknown>(
  model: string,
  body: RestQueryBody = {}
): Promise<T> {
  const res = await apiClient.post<BackendResponse<T>>(`/rest/${model}/query`, body)
  const payload = res.data
  return payload.data as T
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
