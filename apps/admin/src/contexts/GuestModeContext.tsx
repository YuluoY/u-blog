import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { apiClient, setGuestMode } from '../shared/api/client'

/**
 * 游客只读模式上下文
 *
 * 当 URL 携带 ?guest=1 时，向后端校验 guest_admin_view_enabled 设置，
 * 若开启则进入只读模式：隐藏所有写入/导出操作。
 */
export interface GuestModeContextValue {
  /** 是否处于游客只读模式 */
  isGuest: boolean
  /** 初始化是否完成 */
  guestLoading: boolean
}

const GuestModeContext = createContext<GuestModeContextValue>({
  isGuest: false,
  guestLoading: false,
})

/** 从 URL 搜索参数中检测 guest 标记 */
function hasGuestParam(): boolean {
  const params = new URLSearchParams(window.location.search)
  return params.get('guest') === '1'
}

export function GuestModeProvider({ children }: { children: ReactNode }) {
  const [isGuest, setIsGuest] = useState(false)
  const [guestLoading, setGuestLoading] = useState(() => {
    const hasGuest = hasGuestParam()
    // 立即设置模块级标记，确保 401 拦截器在 settings 请求完成前就能感知游客模式
    if (hasGuest) setGuestMode(true)
    return hasGuest
  })

  const checkGuestMode = useCallback(async () => {
    if (!hasGuestParam()) {
      setIsGuest(false)
      setGuestLoading(false)
      return
    }

    try {
      // 利用已有公开接口查询 guest_admin_view_enabled 设置
      const res = await apiClient.get('/settings', {
        params: { keys: 'guest_admin_view_enabled' },
        skipGlobalError: true,
      })
      const map = res.data?.data ?? {}
      const setting = map['guest_admin_view_enabled']
      const val = setting?.value ?? setting
      const enabled = val === true || val === 'true'
      setIsGuest(enabled)
      // 同步更新模块级标记，让 401 拦截器在游客模式下静默跳过重定向
      if (enabled) setGuestMode(true)
    } catch {
      setIsGuest(false)
    } finally {
      setGuestLoading(false)
    }
  }, [])

  useEffect(() => {
    checkGuestMode()
  }, [checkGuestMode])

  return (
    <GuestModeContext.Provider value={{ isGuest, guestLoading }}>
      {children}
    </GuestModeContext.Provider>
  )
}

/** 获取游客模式状态 */
// eslint-disable-next-line react-refresh/only-export-components
export function useGuestMode(): GuestModeContextValue {
  return useContext(GuestModeContext)
}
