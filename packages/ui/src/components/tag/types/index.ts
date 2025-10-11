import type { CSSProperties } from 'vue'
import type { CTagClosePosition, CTagEffect, CTagSize, CTagType } from '../consts' 

export type UTagType = typeof CTagType[keyof typeof CTagType];
export type UTagSize = typeof CTagSize[keyof typeof CTagSize];
export type UTagEffect = typeof CTagEffect[keyof typeof CTagEffect];
export type UTagClosePosition = typeof CTagClosePosition[keyof typeof CTagClosePosition];

export interface UTagProps {
  type?: UTagType
  size?: UTagSize
  effect?: UTagEffect
  closable?: boolean
  border?: boolean
  color?: CSSProperties['color']
  textColor?: CSSProperties['color']
  round?: boolean
  transition?: boolean
  closePosition?: UTagClosePosition
  triggerClick?: boolean
}

export interface UTagEmits {
  (e: 'close', evt: MouseEvent): void
  (e: 'click', evt: MouseEvent): void
}