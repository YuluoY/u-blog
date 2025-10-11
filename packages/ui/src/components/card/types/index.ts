import { CCardShadow } from '../consts'

export type CardShadow = typeof CCardShadow[keyof typeof CCardShadow];

export interface UCardProps {
  /**
   * 卡片标题
   */
  header?: string
  /**
   * 卡片底部
   */
  footer?: string
  /**
   * 卡片阴影
   */
  shadow?: CardShadow
  /**
   * 卡片内边距
   */
  padding?: number
  /**
   * 卡片内容样式
   */
  bodyStyle?: import('vue').CSSProperties
  /**
   * 卡片内容类名
   */
  bodyClass?: string
  /**
   * 卡片折叠
   */
  collapse?: boolean
}