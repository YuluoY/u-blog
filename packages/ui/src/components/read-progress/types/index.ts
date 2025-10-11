import type { Ref, VNode } from 'vue'
import type { UTextProps } from '@/components'
import type { CReadProgress } from '../consts'

export type UReadProgressType = typeof CReadProgress[keyof typeof CReadProgress];

export interface UReadProgressProps {

  /**
   * @description 进度值
   * @default 0
   */
  modelValue?: number

  /**
   * @description 进度条颜色类型
   * @default 'primary'
   */
  type?: UReadProgressType

  /**
   * @description 进度条颜色
   * @default ''
   */
  color?: string

  /**
   * @description 进度条背景颜色
   * @default 'transparent'
   */
  backgroundColor?: string

  /**
   * @description 进度条高度 px
   * @default 4
   */
  height?: number

  /**
   * @description 进度条是否显示
   * @default true
   */
  show?: boolean

  /**
   * @description 进度条是否显示文字
   * @default true
   */
  showText?: boolean

  /**
   * @description 进度条文字颜色
   * @default 'primary'
   */
  textType?: UTextProps['type']

  /**
   * @description 进度条文字大小
   * @default 'default'
   */
  textSize?: UTextProps['size']

  /**
   * @description 进度条文字内容
   * @default ''
   */
  content?: string
}

export interface UReadProgressEmits {
  /**
   * @description 进度值更新
   */
  (e: 'update:modelValue', value: number): void

  /**
   * @description 进度改变事件
   */
  (e: 'change'): void
}

export interface UReadProgressSlots {
  /**
   * @description 自定义内容
   */
  default?: () => VNode | VNode[]
}

export interface UReadProgressExposes {
  /**
   * @description 进度值
   */
  progress: Ref<number>

  /**
   * @description 隐藏进度条
   */
  hide: () => void

  /**
   * @description 显示进度条
   */
  show: () => void
}