import type { RouteRecordRaw } from 'vue-router'

const WriteView = () => import('@/views/WriteView.vue')
const WriteSuccessView = () => import('@/views/WriteSuccessView.vue')

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
  },
  {
    path: '/write/success',
    name: 'writeSuccess',
    component: WriteSuccessView,
    meta: {
      title: '发布成功',
      isAffix: false,
      isHidden: true
    }
  }
]

export default dynamicRoutes
