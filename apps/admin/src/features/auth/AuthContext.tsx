/* eslint-disable react-refresh/only-export-components -- AuthProvider + useAuth 同文件为约定 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { login as apiLogin, refresh } from './api'
import type { LoginRes } from '../../shared/api/types'

export interface AuthContextValue {
  user: LoginRes | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginRes | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    const maxRetries = 3
    const delayMs = 2000
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const data = await refresh()
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

  const login = useCallback(async (username: string, password: string) => {
    const data = await apiLogin(username, password)
    setUser(data)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
