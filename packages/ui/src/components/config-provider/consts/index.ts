import type { InjectionKey, Ref } from 'vue'
import type { UConfigProviderProps } from '../types'

export type ConfigProviderContext = Partial<UConfigProviderProps>

export const configProviderContextKey: InjectionKey<Ref<ConfigProviderContext>> = Symbol()

export const DEFAULT_LANG = 'zh-cn' as const