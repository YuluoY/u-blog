import { InjectionKey } from "vue"
import { ULayoutContext } from "../types"

/**
 * 最大span
 */
export const CMaxSpan = 24 as const

export const CRegion = {
  LEFT: 'left',
  RIGHT: 'right',
  TOP: 'top',
  CENTER: 'center',
  BOTTOM: 'bottom',
} as const


export const CLayoutMode = {
  ROW: 'row',
  COLUMN: 'column',
  DEFAULT: 'default',
} as const

export const CLayoutExtend = {
  LEFT_TOP: 'left-top',
  RIGHT_TOP: 'right-top',
  LEFT_BOTTOM: 'left-bottom',
  RIGHT_BOTTOM: 'right-bottom',
  LEFT: 'left',
  RIGHT: 'right',
  BOTH: 'both'
} as const

export const CComponentName = {
  LAYOUT: 'ULayout',
  REGION: 'URegion',
  LAYOUT_MODE: 'ULayoutMode',
} as const

export const CLayoutFlexAlign = {
  START: 'flex-start',
  END: 'flex-end',
  CENTER: 'center',
  BETWEEN: 'space-between',
  AROUND: 'space-around',
} as const

export const CLayoutDirection = {
  ROW: 'row',
  COLUMN: 'column',
} as const

export const CLayoutContext: InjectionKey<ULayoutContext> = Symbol('u-layout-context')