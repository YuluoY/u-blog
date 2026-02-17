import { apiClient } from './client'
import type { BackendResponse } from './types'
import type { LoginRes } from './types'

export async function login(username: string, password: string): Promise<LoginRes> {
  const res = await apiClient.post<BackendResponse<LoginRes>>('/login', {
    username,
    password,
  })
  const payload = res.data
  if (payload.code !== 0) throw new Error(payload.message || '登录失败')
  return payload.data as LoginRes
}

export async function refresh(): Promise<LoginRes | null> {
  const res = await apiClient.post<BackendResponse<LoginRes>>('/refresh', undefined, {
    skipGlobalError: true,
  })
  const payload = res.data
  if (payload.code !== 0) return null
  return (payload.data as LoginRes) ?? null
}
