import type { CBackTopType, CBackTopShape } from '../consts'

export type UBackTopType = typeof CBackTopType[keyof typeof CBackTopType]
export type UBackTopShape = typeof CBackTopShape[keyof typeof CBackTopShape]

export interface UBackTopProps {
  /**
   * @description 手动控制显隐
   */
  modelValue?: boolean

  /**
   * @description 按钮主题类型（决定背景色）
   * @default 'primary'
   */
  type?: UBackTopType

  /**
   * @description 按钮形状
   * @default 'circle'
   */
  shape?: UBackTopShape

  /**
   * @description 按钮尺寸 (px)
   * @default 44
   */
  size?: number

  /**
   * @description 距离窗口右侧距离 (px)
   * @default 32
   */
  right?: number

  /**
   * @description 距离窗口底部距离 (px)
   * @default 40
   */
  bottom?: number

  /**
   * @description 滚动超过此阈值后显示按钮 (px)
   * @default 300
   */
  visibilityHeight?: number

  /**
   * @description 回到顶部动画时长 (ms)
   * @default 500
   */
  duration?: number

  /**
   * @description 监听滚动的容器选择器，默认 document
   */
  target?: string

  /**
   * @description z-index 层级
   * @default 1000
   */
  zIndex?: number

  /**
   * @description 自定义图标 class（支持 font-awesome）
   */
  icon?: string

  /**
   * @description 是否显示阴影
   * @default true
   */
  shadow?: boolean

  /**
   * @description 是否可拖拽调整位置（百分比定位，持久化到 localStorage）
   * @default false
   */
  draggable?: boolean

  /**
   * @description 拖拽位置持久化的 localStorage key
   * @default 'u-back-top-pos'
   */
  storageKey?: string
}

export interface UBackTopEmits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'click', evt: MouseEvent): void
}

export interface UBackTopExposes {
  /** 滚动到顶部 */
  scrollToTop: () => void
  /** 当前是否可见 */
  readonly visible: boolean
}
