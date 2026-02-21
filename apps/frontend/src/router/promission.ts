import type { Router } from 'vue-router'
import dynamicRoutes from './dynamic'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/model/user'

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

    // 等待认证状态初始化完成（首次访问时 fetchUser 还在进行中）
    if (!userStore.authReady) {
      await userStore.fetchUser()
    }

    const isLoggedIn = userStore.isLoggedIn

    // 仅游客可访问的页面（如登录页），已登录则回首页
    if (to.meta.guestOnly && isLoggedIn) {
      next({ name: 'home', replace: true })
      return
    }

    // 需要认证的页面，未登录则跳转登录页（保留 redirect 参数）
    if (to.meta.requiresAuth && !isLoggedIn) {
      next({ name: 'login', query: { redirect: to.fullPath }, replace: true })
      return
    }

    next()
  })

  router.afterEach(() =>
  {
    const { replRoutes } = useAppStore()
    replRoutes(router.getRoutes())
  })
}

export default permission
