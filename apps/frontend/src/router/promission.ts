import type { Router } from 'vue-router'
import dynamicRoutes from './dynamic'
import { useAppStore } from '@/stores/app'

const permission = (router: Router) =>
{
  // 添加动态路由
  dynamicRoutes.forEach(route => router.addRoute(route))

  router.beforeEach(async(to, from, next) =>
  {
    // 如果路由不存在，重定向到首页
    if (to.matched.length === 0)
    {
      next({ name: 'NotFound', replace: true })
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
