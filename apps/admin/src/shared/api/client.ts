import axios, { type AxiosError } from 'axios'
import { message as antdMessage } from 'antd'
import type { BackendResponse } from './types'

/** 内存中保存的 access token（不持久化，刷新页面后通过 /refresh 恢复） */
let accessToken: string | null = null

/** 设置 access token（refresh 成功后调用） */
export function setAccessToken(token: string | null) {
  accessToken = token
}

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

/* ---------- 请求拦截器：自动附带 Authorization 头 ---------- */
apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

let onUnauthorized: (() => void) | null = null
export function setOnUnauthorized(fn: (() => void) | null) {
  onUnauthorized = fn
}

interface MessageLike {
  error: (content: string) => void
  success?: (content: string) => void
}
let messageInstance: MessageLike | null = null
export function setMessageInstance(instance: MessageLike | null) {
  messageInstance = instance
}

function getMessage() {
  return messageInstance ?? antdMessage
}

declare module 'axios' {
  // 扩展 AxiosRequestConfig 使 .post() 等调用处也能传 skipGlobalError
  // InternalAxiosRequestConfig 继承自 AxiosRequestConfig，拦截器中同样可访问
  interface AxiosRequestConfig {
    skipGlobalError?: boolean
  }
}

apiClient.interceptors.response.use(
  (res) => {
    const payload = res.data as BackendResponse<unknown>
    if (payload?.code !== 0 && payload?.code !== undefined) {
      // skipGlobalError 时不弹 toast，仅 reject（如 refresh 静默失败）
      if (!res.config?.skipGlobalError) {
        getMessage().error(payload.message || '请求失败')
      }
      return Promise.reject(new Error(payload.message || '请求失败'))
    }
    return res
  },
  (err: AxiosError<BackendResponse>) => {
    if (err.config?.skipGlobalError) {
      return Promise.reject(err)
    }
    const status = err.response?.status
    const payload = err.response?.data
    const msg = payload?.message || err.message || '网络错误'
    if (status === 401) {
      accessToken = null
      onUnauthorized?.()
      getMessage().error('登录已过期，请重新登录')
    } else {
      getMessage().error(msg)
    }
    return Promise.reject(err)
  }
)
