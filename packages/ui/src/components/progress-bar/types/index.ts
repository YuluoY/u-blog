import type { CProgressBarType, CProgressBarPosition } from '../consts'

export type UProgressBarType = typeof CProgressBarType[keyof typeof CProgressBarType]
export type UProgressBarPosition = typeof CProgressBarPosition[keyof typeof CProgressBarPosition]

export interface UProgressBarProps {
  /**
   * @description 当前进度值 0–100
   * @default 0
   */
  modelValue?: number

  /**
   * @description 进度条类型（决定颜色）
   * @default 'primary'
   */
  type?: UProgressBarType

  /**
   * @description 自定义颜色（覆盖 type）
   */
  color?: string

  /**
   * @description 进度条高度 (px)
   * @default 3
   */
  height?: number

  /**
   * @description 固定位置
   * @default 'top'
   */
  position?: UProgressBarPosition

  /**
   * @description 是否固定在窗口顶部/底部
   * @default true
   */
  fixed?: boolean

  /**
   * @description z-index 层级
   * @default 9999
   */
  zIndex?: number

  /**
   * @description 是否显示加载光效动画
   * @default true
   */
  showGlow?: boolean

  /**
   * @description 背景色
   * @default 'transparent'
   */
  backgroundColor?: string

  /**
   * @description 圆角
   * @default 0
   */
  borderRadius?: number

  /**
   * @description 是否显示不确定进度（持续动画，用于不知道总进度的场景）
   * @default false
   */
  indeterminate?: boolean
}

export interface UProgressBarEmits {
  (e: 'update:modelValue', value: number): void
  (e: 'done'): void
}

export interface UProgressBarExposes {
  /** 开始加载：进度从 0 缓慢增长 */
  start: () => void
  /** 完成加载：进度快速到 100 并隐藏 */
  done: () => void
  /** 设置指定进度 */
  set: (value: number) => void
  /** 递增进度 */
  inc: (amount?: number) => void
  /** 立即失败（红色闪一下） */
  fail: () => void
  /** 当前是否正在加载 */
  readonly isLoading: boolean
}
