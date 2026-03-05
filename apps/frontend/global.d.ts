// eslint-disable-next-line spaced-comment
// 引入 UI 库的全局组件声明（UBadge/UButton 等），确保模板中有类型提示
// / <reference types="@u-blog/ui/dist/u-blog-ui.d.ts" />

import { App } from 'vue'
import type { AppFn } from '@/app/fn'
import type { IStore } from '@/stores'

declare global {
  const $u: IStore
  const __BUILD_HASH__: string
  interface Window {
    $u: IStore
    $uFn: AppFn
    /** DEV：调试用评论快捷入口 */
    __debugAddComment?: (data: {
      content: string
      path: string
      userId: number
      pid?: number | null
      articleId?: number | null
    }) => Promise<unknown>
    /** 首屏 splash 开始时间戳 */
    __splashStart?: number
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    index?: number      // 索引
    icon?: string       // 图标
    title?: string      // 标题显示
    isHidden?: boolean  // 是否显示
    isAffix?: boolean   // 是否是固定导航路由
    isHero?: boolean    // 是否显示hero封面
    isLeftSide?: boolean  // 左侧side
    isRightSide?: boolean // 右侧side
  }
}

export {}
