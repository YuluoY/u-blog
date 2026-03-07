/* eslint-disable react-refresh/only-export-components -- AuthProvider + useAuth 同文件为约定 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { refresh } from './api'
import type { LoginRes } from '../../shared/api/types'

/** 前端登录页地址，未认证时重定向到此处 */
export const FRONTEND_LOGIN_URL =
  import.meta.env.VITE_FRONTEND_URL
    ? `${import.meta.env.VITE_FRONTEND_URL}/login`
    : import.meta.env.PROD
      ? `${window.location.origin}/login`
      : 'http://localhost:5173/login'

/** 前台站点首页地址 */
export const FRONTEND_HOME_URL = FRONTEND_LOGIN_URL.replace(/\/login$/, '')

/**
 * 模块级 Promise 去重：
 * React 18 StrictMode 在开发环境下会双重挂载组件，导致 checkAuth 被调用两次。
 * 后端使用旋转刷新令牌（refresh 后旧 RT 立即失效），并发请求会导致第二次失败。
 * 通过共享同一个 Promise，确保只发出一次 HTTP 请求。
 */
let _refreshPromise: Promise<LoginRes | null> | null = null
function deduplicatedRefresh(): Promise<LoginRes | null> {
  if (!_refreshPromise) {
    _refreshPromise = refresh().finally(() => {
      _refreshPromise = null
    })
  }
  return _refreshPromise
}

export interface AuthContextValue {
  user: LoginRes | null
  loading: boolean
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginRes | null>(null)
  const [loading, setLoading] = useState(true)

  /** 通过 httpOnly cookie 刷新令牌检查登录态（与前端共享同一 cookie） */
  const checkAuth = useCallback(async () => {
    const maxRetries = 3
    const delayMs = 2000
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const data = await deduplicatedRefresh()
        setUser(data)
        setLoading(false)
        return
      } catch (e: unknown) {
        const err = e as { response?: { status?: number }; message?: string }
        // 后端未就绪：无 response（Network Error）或 503
        const isRetryable =
          (!err.response && err.message?.includes('Network Error')) ||
          err.response?.status === 503
        if (i < maxRetries && isRetryable) {
          await new Promise((r) => setTimeout(r, delayMs))
          continue
        }
        setUser(null)
        setLoading(false)
        return
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
