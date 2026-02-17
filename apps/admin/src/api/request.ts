import axios from 'axios'

const instance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

export interface BackendResponse<T = unknown> {
  code: number
  data: T
  message: string
  timestamp?: number
}

export async function restQuery<T = unknown>(
  model: string,
  body: {
    where?: Record<string, unknown>
    take?: number
    skip?: number
    order?: Record<string, 'ASC' | 'DESC'>
    relations?: string[]
  } = {}
): Promise<T> {
  const res = await instance.post<BackendResponse<T>>(`/rest/${model}/query`, body)
  const payload = res.data
  if (payload.code !== 0) throw new Error(payload.message || '请求失败')
  return payload.data as T
}

export async function restAdd<T = unknown>(
  model: string,
  body: Record<string, unknown> = {}
): Promise<T> {
  const res = await instance.post<BackendResponse<T>>(`/rest/${model}/add`, body)
  const payload = res.data
  if (payload.code !== 0) throw new Error(payload.message || '请求失败')
  return payload.data as T
}

export async function restUpdate<T = unknown>(
  model: string,
  id: number,
  body: Record<string, unknown> = {}
): Promise<T> {
  const res = await instance.put<BackendResponse<T>>(`/rest/${model}/update`, { id, ...body })
  const payload = res.data
  if (payload.code !== 0) throw new Error(payload.message || '请求失败')
  return payload.data as T
}

export async function restDel(model: string, id: number): Promise<void> {
  const res = await instance.delete<BackendResponse<unknown>>(`/rest/${model}/del`, {
    data: { id },
  })
  const payload = res.data
  if (payload.code !== 0) throw new Error(payload.message || '请求失败')
}

export interface LoginRes {
  id: number
  username: string
  role?: string
  namec?: string
}

export async function login(username: string, password: string): Promise<LoginRes> {
  const res = await instance.post<BackendResponse<LoginRes>>('/login', {
    username,
    password,
  })
  const payload = res.data
  if (payload.code !== 0) throw new Error(payload.message || '登录失败')
  return payload.data as LoginRes
}

export async function refresh(): Promise<LoginRes | null> {
  const res = await instance.post<BackendResponse<LoginRes>>('/refresh')
  const payload = res.data
  if (payload.code !== 0) return null
  return (payload.data as LoginRes) ?? null
}

export default instance
