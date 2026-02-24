import { useAuth, FRONTEND_LOGIN_URL } from './AuthContext'
import { useGuestMode } from '../../contexts/GuestModeContext'
import { useLocation, Navigate } from 'react-router-dom'

/** 游客可访问路径白名单（与 AdminLayout 保持一致） */
const GUEST_ALLOWED_PATHS = new Set([
  '/', '/dashboard',
  '/articles', '/categories', '/tags', '/media', '/about-blocks',
  '/likes', '/views',
  '/comments', '/friend-links', '/xiaohui',
  '/analytics',
])

/**
 * 路由守卫：
 * - 游客只读模式（?guest=1 且后端已开启）→ 仅允许白名单路径，其余重定向到仪表盘
 * - 已认证 → 放行
 * - 未认证 → 重定向到前端登录页
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const { isGuest, guestLoading } = useGuestMode()
  const location = useLocation()

  // 等待认证和游客模式校验完成
  if (loading || guestLoading) {
    return <div style={{ padding: 24, textAlign: 'center' }}>加载中…</div>
  }

  // 游客只读模式：仅放行白名单路径
  if (isGuest) {
    if (!GUEST_ALLOWED_PATHS.has(location.pathname)) {
      return <Navigate to="/dashboard" replace />
    }
    return <>{children}</>
  }

  if (!user) {
    const returnUrl = encodeURIComponent(window.location.href)
    window.location.href = `${FRONTEND_LOGIN_URL}?returnUrl=${returnUrl}`
    return null
  }

  return <>{children}</>
}
