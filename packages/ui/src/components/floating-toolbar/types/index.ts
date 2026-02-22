import type { UToolbarAction, UToolbarSize } from '../../toolbar/types'

/** 复用 UToolbar 的 Action 类型 */
export type { UToolbarAction as UFloatingToolbarAction }

/**
 * UFloatingToolbar 浮动操作栏 Props
 * 继承 UToolbar 的视觉属性，扩展浮动定位 + 选区检测能力
 */
export interface UFloatingToolbarProps {
  /** 操作按钮列表（透传给 UToolbar） */
  actions?: UToolbarAction[]
  /** 限定选区的容器元素，为 null 时不工作 */
  container?: HTMLElement | null
  /** 加载状态（透传给 UToolbar） */
  loading?: boolean
  /** 加载提示文字（透传给 UToolbar） */
  loadingText?: string
  /** 触发显示的最小选中字符数 @default 1 */
  minLength?: number
  /** 消失延迟 (ms) @default 200 */
  hideDelay?: number
  /** 工具条尺寸（透传给 UToolbar） @default 'small' */
  size?: UToolbarSize
}

/** UFloatingToolbar 事件 */
export interface UFloatingToolbarEmits {
  /** 用户点击了某个操作项 */
  (e: 'action', key: string, selectedText: string): void
  /** 工具栏可见性变化 */
  (e: 'visible-change', visible: boolean): void
}

/** UFloatingToolbar 实例方法 */
export interface UFloatingToolbarInstance {
  /** 手动隐藏工具栏 */
  hide: () => void
}
