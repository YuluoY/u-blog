import type { App } from 'vue'
import Snowfall from './Snowfall.vue'
import type { SnowfallOptions } from './types'

/**
 * Vue 插件：注册全局组件 Snowfall。
 * 在根组件（如 App.vue）中放置 <Snowfall :options="options" /> 即可使用。
 */
export function installSnowfall(app: App) {
  app.component('Snowfall', Snowfall)
}

export type { SnowfallOptions }
