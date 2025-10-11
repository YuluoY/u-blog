import type { RouteRecordRaw } from 'vue-router'

const SettingView = () => import('@/views/SettingView.vue')
const WriteView = () => import('@/views/WriteView.vue')

const dynamicRoutes: readonly RouteRecordRaw[] = [
  {
    path: '/write',
    name: 'WriteView',
    component: WriteView,
    meta: {
      title: '撰写',
      isAffix: true
    }
  },
  {
    path: '/setting',
    name: 'SettingView',
    component: SettingView,
    meta: {
      title: '设置',
      isAffix: true
    }
  }
]

export default dynamicRoutes
