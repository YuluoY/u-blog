// eslint-disable-next-line spaced-comment
/// <reference types="vite/client" />

import type { UserRole } from '@u-blog/model'

/** 扩展 vue-router RouteMeta */
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    isAffix?: boolean
    index?: number
    isLeftSide?: boolean
    isRightSide?: boolean
    isHidden?: boolean
    /** 需要登录才能访问 */
    requiresAuth?: boolean
    /** 仅游客可访问（已登录则跳转首页） */
    guestOnly?: boolean
    /** 允许访问的最低角色 */
    minRole?: UserRole
  }
}

declare module '*.vue' {
  import { DefineComponent } from 'vue'

  const component: DefineComponent<{}, {}, any>

  export default component
}

declare module '*.tsx' {
  import { DefineComponent } from 'vue'

  const component: DefineComponent<{}, {}, any>

  export default component
}

/** View Transitions API（Chrome 111+）类型补充 */
interface ViewTransition {
  finished: Promise<void>
  ready: Promise<void>
  updateCallbackDone: Promise<void>
}

interface Document {
  startViewTransition?: (callback: () => void | Promise<void>) => ViewTransition
}

/** 开发环境控制台抓包：触发评论请求，便于后端分析 */
interface Window {
  __debugAddComment?: (data: { content: string; path: string; userId: number; pid?: number | null }) => Promise<{ id: number }>
}

/** 词云组件无官方类型 */
declare module 'vuewordcloud' {
  import type { DefineComponent } from 'vue'
  const VueWordCloud: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default VueWordCloud
}

/** workspace 包类型未解析时的回退声明 */
declare module '@u-blog/utils' {
  export function watchFn<T>(
    fn: () => T | Promise<T>,
    callback: (result: T) => void,
    options?: { delay?: number; timeout?: number; timeoutFn?: () => void }
  ): () => void
  export function pxToRem(value: number): string
}
