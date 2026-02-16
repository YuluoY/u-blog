import type { CTopPosition } from '../consts'

export type UTopPosition = typeof CTopPosition[keyof typeof CTopPosition]
export interface UTopProps {
  /**
   * @description 是否显示回到顶部按钮
   * @default false
   */
  modelValue?: boolean

  /**
   * @description 传送
   * @default 'body'
   */
  appendTo?: string

  /**
   * @description 按钮大小
   * @default 40
   */
  size?: number

  /**
   * @description 回到顶部按钮的显示位置
   * @default 'right'
   */
  position?: UTopPosition

  /**
   * @description 按钮偏移量位置
   * @default 50
   */
  offset?: number

  /**
   * @description 动画类名
   * @default 'u-top-fade'
   */
  animationClass?: string

  /**
   * @description 滚动条距离顶部多少时显示按钮
   * @default 200 / '30%'
   */
  scrollThreshold?: number | string

  /**
   * @description 滚动动画时长（ms）
   * @default 500
   */
  duration?: number
}

export interface UTopEmits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'click', evt: Event): void
}

export interface UTopExposes {
  /**
   * @description 显示回到顶部按钮
   */
  show: () => void

  /**
   * @description 隐藏回到顶部按钮
   */
  hide: () => void

  /**
   * @description 切换回到顶部按钮的显示状态
   */
  toggle: () => void

  /**
   * @description 校验是否显示按钮
   */
  validate: () => boolean

  /**
   * @description 滚动到指定位置
   */
  scrollTo: (position: number) => void

  /**
   * @description 滚动到顶部
   */
  scrollToTop: () => void

  /**
   * @description 滚动到底部
   */
  scrollToBottom: () => void

  /**
   * @description 滚动到指定元素
   */
  scrollToElement: (element: HTMLElement) => void

  /**
   * @description 组件是否可见
   */
  visible: boolean
}

export type UTopInstance = UTopProps & UTopExposes