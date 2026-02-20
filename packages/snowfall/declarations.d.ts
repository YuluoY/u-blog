import type { App } from 'vue'

export interface SnowfallOptions {
  count?: number
  themeColors?: string[]
  messages?: string[]
  zIndex?: number
  sizeMin?: number
  sizeMax?: number
  durationMin?: number
  durationMax?: number
  distribution?: number
}

export const Snowfall: import('vue').DefineComponent<{
  options?: SnowfallOptions
}>
export function installSnowfall(app: App): void
export const DEFAULT_MESSAGES: string[]

declare const _default: { install: typeof installSnowfall }
export default _default
