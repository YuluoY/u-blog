import type { RouteRecordRaw } from 'vue-router'

const WriteView = () => import('@/views/WriteView.vue')

const dynamicRoutes: readonly RouteRecordRaw[] = [
  {
    path: '/write',
    name: 'write',
    component: WriteView,
    meta: {
      title: '撰写',
      isAffix: true,
      index: 7
    }
  }
]

export default dynamicRoutes
