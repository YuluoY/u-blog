// eslint-disable-next-line spaced-comment
/// <reference types="@ucc-blog/ui/dist/ucc-blog-ui.d.ts" />

import { App } from 'vue'
import type { AppFn } from '@/app/fn'
import type { IStore } from '@/stores'

declare global {
  const $u: IStore
  interface Window {
    $u: IStore
    $uFn: AppFn
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
