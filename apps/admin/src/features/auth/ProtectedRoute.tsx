import { useAuth, FRONTEND_LOGIN_URL } from './AuthContext'

/**
 * 路由守卫：未认证时重定向到前端登录页（Admin 不再拥有独立登录页）。
 * 认证依赖与前端共享的 httpOnly refresh-token cookie。
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}>加载中…</div>
  }

  if (!user) {
    // 携带 returnUrl 以便前端登录后可跳回 admin
    const returnUrl = encodeURIComponent(window.location.href)
    window.location.href = `${FRONTEND_LOGIN_URL}?returnUrl=${returnUrl}`
    // 重定向期间展示空白，防止闪烁
    return null
  }

  return <>{children}</>
}
