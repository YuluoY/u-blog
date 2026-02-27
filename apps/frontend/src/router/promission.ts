import type { Router } from 'vue-router'
import dynamicRoutes from './dynamic'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/model/user'
import { useBlogOwnerStore } from '@/stores/blogOwner'

const permission = (router: Router) =>
{
  // 添加动态路由
  dynamicRoutes.forEach(route => router.addRoute(route))

  router.beforeEach(async(to, _from, next) =>
  {
    // 如果路由不存在，重定向到 404
    if (to.matched.length === 0)
    {
      next({ name: 'NotFound', replace: true })
      return
    }

    const userStore = useUserStore()
    const appStore = useAppStore()

    // 等待认证状态初始化完成（首次访问时 fetchUser 还在进行中）
    if (!userStore.authReady) {
      await userStore.fetchUser()
    }

    // 后台控制的路由可见性：被隐藏的路由不可访问，重定向到首页
    // 排除基础路由（NotFound、根路径重定向）
    const routeName = to.name ? String(to.name) : ''
    if (routeName && routeName !== 'NotFound' && routeName !== 'home' && appStore.isRouteHidden(routeName)) {
      next({ name: 'home', replace: true })
      return
    }

    const isLoggedIn = userStore.isLoggedIn

    // 仅游客可访问的页面（如登录页），已登录则回首页
    // 特殊处理：如果携带 returnUrl 参数（如从管理后台重定向来的），直接跳转回去
    if (to.meta.guestOnly && isLoggedIn) {
      const returnUrl = to.query.returnUrl as string | undefined
      if (returnUrl) {
        const decoded = decodeURIComponent(returnUrl)
        if (decoded.startsWith('/') || decoded.startsWith(window.location.origin) || decoded.includes('localhost')) {
          // 取消 Vue Router 导航后执行外部跳转（不调用 next 会导致 Invalid navigation guard 错误）
          next(false)
          window.location.href = decoded
          return
        }
      }
      next({ name: 'home', replace: true })
      return
    }

    // 需要认证的页面——未登录时通常跳转登录
    // 例外：子域名「完整模式」下，游客可以访问 /chat（使用博主配置的 AI 模型）
    if (to.meta.requiresAuth && !isLoggedIn) {
      const blogOwnerStore = useBlogOwnerStore()
      const isFullModeChat =
        blogOwnerStore.isSubdomainMode &&
        !blogOwnerStore.isReadOnly &&
        to.name === 'chat'

      if (!isFullModeChat) {
        next({ name: 'login', query: { redirect: to.fullPath }, replace: true })
        return
      }
    }

    next()
  })

  router.afterEach((to) =>
  {
    const { replRoutes } = useAppStore()
    replRoutes(router.getRoutes())

    // 动态更新页面标题：{pageTitle} - {siteName}
    const appStore = useAppStore()
    appStore.updateDocumentTitle(to.meta.title as string | undefined)
  })
}

export default permission
