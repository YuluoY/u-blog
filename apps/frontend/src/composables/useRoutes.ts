import type { RouteRecordRaw } from 'vue-router'
export const useRoutes = () =>
{
  const routes = shallowRef<RouteRecordRaw[]>([])

  /**
   * 添加路由
   */
  const addRoutes = (route: RouteRecordRaw | RouteRecordRaw[]) =>
  {
    Array.isArray(route) ? routes.value.push(...route) : routes.value.push(route)
    replRoutes(routes.value)
  }

  /**
   * 替换路由
   */
  const replRoutes = (newRoutes: RouteRecordRaw[]) =>
  {
    routes.value = sortedRoutes(newRoutes)
  }

  /**
   * 刷新路由
   */
  const refreshRoutes = () =>
  {
    routes.value = sortedRoutes(routes.value)
  }

  /**
   * 排序路由
   */
  const sortedRoutes = (newRoutes: RouteRecordRaw[]) =>
  {
    return newRoutes.toSorted((a, b) => a.meta?.index! - b.meta?.index!)
  }

  return {
    routes,
    sortedRoutes,
    addRoutes,
    refreshRoutes,
    replRoutes
  }
}