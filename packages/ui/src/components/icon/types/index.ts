import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import type { CIconSize, CIconRotation, CIconType, CIconFlip, CIconPull } from '../consts'

export type UIconSize = typeof CIconSize[number]
export type UIconRotation = typeof CIconRotation[number]
export type UIconType = typeof CIconType[number]
export type UIconFlip = typeof CIconFlip[number]
export type UIconPull = typeof CIconPull[number]

export interface UIconProps {
   /**
   * @description 是否显示图标边框
   * @type {boolean}
   * @default false
   */
  border?: boolean
  
  /**
   * @description 是否使用固定宽度，适合在列表或导航中使用
   * @type {boolean}
   * @default false
   */
  fixedWidth?: boolean
  
  /**
   * @description 图标翻转方向
   * @type {UIconFlip}
   * @values 'horizontal' | 'vertical' | 'both' | 'default'
   * @default 'default'
   */
  flip?: UIconFlip
  
  /**
   * @description 图标名称，可以是以下几种形式：
   * - 字符串：如 'home'、'user'
   * - 数组：如 ['fas', 'user']，第一个元素是图标前缀，第二个是图标名称
   * - 对象：直接传入 Font Awesome 的图标对象
   * - IconDefinition：Font Awesome 的图标定义
   * @type {object | Array<string> | string | IconDefinition}
   * @required
   */
  icon: object | Array<string> | string | IconDefinition
  
  /**
   * @description 图标遮罩，用于创建复合图标
   * @type {object | Array<string> | string}
   */
  mask?: object | Array<string> | string
  
  /**
   * @description 是否作为列表项图标，会添加适当的样式
   * @type {boolean}
   * @default false
   */
  listItem?: boolean
  
  /**
   * @description 图标对齐方向
   * @type {UIconPull}
   * @values 'left' | 'right' | 'default'
   * @default 'default'
   */
  pull?: UIconPull
  
  /**
   * @description 是否使用脉冲旋转动画
   * @type {boolean}
   * @default false
   */
  pulse?: boolean
  
  /**
   * @description 图标旋转角度
   * @type {UIconRotation}
   * @values '90' | '180' | '270' | 90 | 180 | 270 | 'default'
   * @default 'default'
   */
  rotation?: UIconRotation
  
  /**
   * @description 是否交换图标的不透明度
   * @type {boolean}
   * @default false
   */
  swapOpacity?: boolean
  
  /**
   * @description 图标大小
   * @type {UIconSize}
   * @values '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '1x' | '2x' | '3x' | '4x' | '5x' | '6x' | '7x' | '8x' | '9x' | '10x'
   */
  size?: UIconSize
  
  /**
   * @description 是否使用旋转动画
   * @type {boolean}
   * @default false
   */
  spin?: boolean
  
  /**
   * @description 图标变换，可以是变换对象或变换字符串
   * @type {object | string}
   */
  transform?: object | string
  
  /**
   * @description 是否将图标转换为 SVG 符号，用于重复使用
   * @type {boolean}
   * @default false
   */
  symbol?: boolean
  
  /**
   * @description 图标标题，用于无障碍访问
   * @type {string}
   */
  title?: string

  /**
   * @description 无障碍标签，优先于 title
   * @type {string}
   */
  ariaLabel?: string

  /**
   * @description 是否为装饰性图标（设为 true 时使用 aria-hidden）
   * @type {boolean}
   */
  decorative?: boolean
  
  /**
   * 是否反转图标颜色
   * @default false
   */
  inverse?: boolean
  
  /**
   * 是否使用弹跳动画
   * @default false
   */
  bounce?: boolean
  
  /**
   * 是否使用摇晃动画
   * @default false
   */
  shake?: boolean
  
  /**
   * 是否使用淡入淡出动画
   * @default false
   */
  fade?: boolean
  
  /**
   * 是否使用心跳淡入淡出动画
   * @default false
   */
  beatFade?: boolean
  
  /**
   * 是否使用旋转脉冲动画
   * @default false
   */
  spinPulse?: boolean
  
  /**
   * 是否反向旋转
   * @default false
   */
  spinReverse?: boolean
  
  /**
   * 图标类型，会应用预设的颜色样式
   * @values 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'default'
   */
  type?: UIconType
  
  /**
   * 图标颜色，会覆盖 type 的颜色设置
   */
  color?: string
}