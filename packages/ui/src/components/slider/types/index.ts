import type { CSliderSize } from '../consts'
import type { Placement, Options } from '@popperjs/core'

export type USliderSize = typeof CSliderSize[keyof typeof CSliderSize];

export interface USliderProps {
  /**
   * @description 滑动条当前值
   * @type {number}
   */
  modelValue?: number

  /**
   * @description 滑动条最大值
   * @type {number}
   */
  max?: number

  /**
   * @description 滑动条最小值
   * @type {number}
   */
  min?: number

  /**
   * @description 滑动步长
   * @type {number}
   */
  step?: number

  /**
   * @description 是否禁用
   * @type {boolean}
   * @default false
   */
  disabled?: boolean

  /**
   * @description 是否显示输入框
   * @type {boolean}
   * @default false
   */
  showInput?: boolean

  /**
   * @description 在显示输入框的情况下，是否显示输入框的控制按钮
   * @type {boolean}
   * @default false
   */
  showInputControl?: boolean

  /**
   * @description slider 包装器的大小，垂直模式下该属性不可用
   * @default default
   */
  size?: USliderSize

  /**
   * @description 输入框的大小，如果设置了 size 属性，默认值自动取 size
   * @type {USliderSize}
   * @default default
   */
  inputSize?: USliderSize

  /**
   * @description 是否显示间断点
   * @type {boolean}
   * @default false
   */
  showStops?: boolean

  /**
   * @description 是否显示提示
   * @type {boolean}
   * @default true
   */
  showTooltip?: boolean

  /**
   * @description 格式化提示信息
   * @type {(value: number): number | string}
   * @default (value: number): number | string => value
   */
  formatTooltip?: (value: number) => number | string

  /**
   * @description 是否开启选择范围
   * @type {boolean}
   * @default false
   */
  range?: boolean

  /**
   * @description 垂直模式
   * @type {boolean}
   * @default false
   */
  vertical?: boolean

  /**
   * @description 滑块高度，垂直模式必填
   * @type {string}
   * @default ''
   */
  height?: string

  /**
   * @description 原生 aria-label属性
   * @type {string}
   * @default ''
   */
  ariaLabel?: string

  /**
   * @description 当 range 为true时，屏幕阅读器标签开始的标记
   * @type {string}
   * @default ''
   */
  rangeStartLabel?: string

  /**
   * @description 当 range 为true时，屏幕阅读器标签结束的标记
   * @type {string}
   * @default ''
   */
  rangeEndLabel?: string

  /**
   * @description 显示屏幕阅读器的 aria-valuenow 属性的格式
   * @type {(value: number): string}
   * @default -
   */
  formatValueText?: string

  /**
   * @description 输入时的去抖延迟，毫秒，仅在 show-input 等于 true 时有效
   * @type {number}
   * @default 300
   */
  debounce?: number

  /**
   * @description tooltip 的自定义类名
   * @type {string}
   * @default ''
   */
  tooltipClass?: string

  /**
   * @description Tooltip 出现的位置
   * @type {string}
   * @default top
   */
  placement?: Placement

  /**
   * @description 标记， key 的类型必须为 number 且取值在闭区间 [min, max] 内，每个标记可以单独设置样式
   * @type {Record<number, string | { style: import('vue').CSSProperties; label: any }>}
   * @default {}
   */
  marks?: Record<number, string | { style: import('vue').CSSProperties; label: any }>

  /**
   * @description 输入时是否触发表单的校验
   * @type {boolean}
   * @default false
   */
  validateEvent?: boolean

  /**
   * @description popper.js 的参数
   * @type {Options}
   * @default {}
   */
  popperOptions?: Options
}

export type USliderEmits = {
  <T = number>(e: 'update:modelValue', value: T | T[]): void
  <T = number>(e: 'change', value: T | T[]): boolean
  <T = number>(e: 'input', value: T | T[]): boolean
}