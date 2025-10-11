import type { CSSProperties } from 'vue'
import { CBadgeType } from '../consts'

export type UBadgeType = typeof CBadgeType[keyof typeof CBadgeType];

export interface UBadgeProps {
  /**
   * @description 显示值
   * @default ''
   */
  value?: string | number

  /**
   * @description 最大值，超过最大值会显示{max}+。只有当value是数字类型时起作用
   * @default 99
   */
  max?: number

  /**
   * @description 是否显示小圆点
   * @default false
   */
  isDot?: boolean

  /**
   * @description 是否隐藏Badge
   * @default false
   */
  hidden?: boolean

  /**
   * @description badge类型
   * @default 'danger'
   */
  type?: UBadgeType

  /**
   * @description 值为0的时候是否显示badge
   * @default true
   */
  showZero?: boolean

  /**
   * @description 背景色
   * @default ''
   */
  color?: string

  /**
   * @description badge的偏移量
   */
  offset?: [number, number]

  /**
   * @description 自定义badge样式
   */
  badgeStyle?: CSSProperties

  /**
   * @description 自定义badge类名
   */
  badgeClass?: string
}