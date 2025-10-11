import type { InjectionKey, Reactive } from 'vue'
import type { UMenuContext } from '../types'

/**
 * u-menu 上下文 唯一标识
 */
export const CMenuContextKey: InjectionKey<Reactive<UMenuContext>> = Symbol('u-menu-context')

export const CMenuType = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical'
} as const

export type UMenuType = (typeof CMenuType)[keyof typeof CMenuType]
