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

/** 游客只读模式标记：为 true 时 401 不触发重定向 */
let guestMode = false
export function setGuestMode(val: boolean) {
  guestMode = val
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

/* ---------- 401 自动刷新 token 队列 ---------- */
let isRefreshing = false
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

/**
 * 尝试通过 refresh token（httpOnly cookie）恢复 access token。
 * 同一时刻只发一次 /refresh，并发 401 请求排队等待。
 */
function tryRefreshToken(): Promise<string> {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshQueue.push({ resolve, reject })
    })
  }
  isRefreshing = true
  return apiClient
    .post<BackendResponse<{ token: string }>>('/refresh', {}, { skipGlobalError: true })
    .then(res => {
      const token = res.data?.data?.token
      if (res.data?.code === 0 && token) {
        accessToken = token
        refreshQueue.forEach(q => q.resolve(token))
        return token
      }
      throw new Error('refresh failed')
    })
    .catch(err => {
      accessToken = null
      refreshQueue.forEach(q => q.reject(err))
      throw err
    })
    .finally(() => {
      isRefreshing = false
      refreshQueue = []
    })
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
  async (err: AxiosError<BackendResponse>) => {
    const status = err.response?.status
    const originalConfig = err.config as typeof err.config & { _retried?: boolean }

    // 401 且非 /refresh 请求本身 → 尝试刷新 token 后重试
    if (status === 401 && originalConfig && !originalConfig._retried && !originalConfig.url?.includes('/refresh')) {
      originalConfig._retried = true
      try {
        const newToken = await tryRefreshToken()
        originalConfig.headers = originalConfig.headers ?? {}
        originalConfig.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalConfig)
      } catch {
        // refresh 也失败，走到下面的 401 处理
      }
    }

    if (err.config?.skipGlobalError) {
      return Promise.reject(err)
    }
    const payload = err.response?.data
    const msg = payload?.message || err.message || '网络错误'
    if (status === 401) {
      // 游客只读模式下 401 是预期的，静默跳过重定向
      if (!guestMode) {
        accessToken = null
        onUnauthorized?.()
        getMessage().error('登录已过期，请重新登录')
      }
    } else {
      getMessage().error(msg)
    }
    return Promise.reject(err)
  }
)
