import type { InjectionKey } from "vue"
import type { UTimelineContext } from "../types"

export const CTimelinePlacement = {
  TOP: 'top',
  BOTTOM: 'bottom'
} as const

export const CTimelineType = {
  PRIMARY: 'primary',
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
  INFO: 'info',
  LINK: 'link'
} as const

export const CTimelineSize = {
  NORMAL: 'normal',
  LARGE: 'large'
} as const

export const CTimelinePosition = {
  LEFT: 'left',
  RIGHT: 'right',
  CENTER: 'center'
} as const

export const CTimelineDirection = {
  VERTICAL: 'vertical',
  HORIZONTAL: 'horizontal'
} as const

export const CTimelineContextKey: InjectionKey<UTimelineContext> = Symbol('u-timeline-context-key')