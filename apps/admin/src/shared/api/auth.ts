import { apiClient, setAccessToken } from './client'
import type { BackendResponse } from './types'
import type { LoginRes } from './types'

export async function login(username: string, password: string): Promise<LoginRes> {
  const res = await apiClient.post<BackendResponse<LoginRes>>('/login', {
    username,
    password,
  })
  const payload = res.data
  if (payload.code !== 0) throw new Error(payload.message || '登录失败')
  const data = payload.data as LoginRes
  // 保存 access token 到内存，后续请求自动附带 Authorization 头
  if (data?.token) setAccessToken(data.token)
  return data
}

export async function refresh(): Promise<LoginRes | null> {
  const res = await apiClient.post<BackendResponse<LoginRes>>('/refresh', undefined, {
    skipGlobalError: true,
  })
  const payload = res.data
  if (payload.code !== 0) return null
  const data = (payload.data as LoginRes) ?? null
  // 保存 access token 到内存，后续请求自动附带 Authorization 头
  if (data?.token) setAccessToken(data.token)
  return data
}
