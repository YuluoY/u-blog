import * as VueRouter from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import permission from './promission'

const HomeView = () => import('@/views/HomeView.vue')
const AboutView = () => import('@/views/AboutView.vue')
const NotFoundView = () => import('@/views/NotFoundView.vue')
const ArchiveView = () => import('@/views/ArchiveView.vue')
const ReadView = () => import('@/views/ReadView.vue')
const MessageView = () => import('@/views/MessageView.vue')
const SettingView = () => import('@/views/SettingView.vue')
const ChatView = () => import('@/views/ChatView.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'home',
    component: HomeView,
    meta: {
      title: '首页',
      isAffix: true,
      index: 1,
      isLeftSide: true,
      isRightSide: true
    }
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView,
    meta: {
      title: '关于',
      isAffix: true,
      index: 3
    }
  },
  {
    path: '/archive',
    name: 'archive',
    component: ArchiveView,
    meta: {
      title: '归档',
      isAffix: true,
      index: 2,
      isLeftSide: true,
      isRightSide: true
    }
  },
  {
    path: '/message',
    name: 'message',
    component: MessageView,
    meta: {
      index: 4,
      title: '留言',
      isAffix: true
    }
  },
  {
    path: '/setting',
    name: 'setting',
    component: SettingView,
    meta: {
      index: 5,
      title: '设置',
      isAffix: true
    }
  },
  {
    path: '/chat',
    name: 'chat',
    component: ChatView,
    meta: {
      index: 6,
      title: '小惠',
      isAffix: true
    }
  },
  {
    path: '/read/:id',
    name: 'read',
    component: ReadView,
    meta: {
      title: '阅读',
      isAffix: false
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundView,
    meta: {
      isHidden: true
    }
  }
]
const router = VueRouter.createRouter({
  history: VueRouter.createWebHistory(),
  routes: routes
})

permission(router)

export default router
