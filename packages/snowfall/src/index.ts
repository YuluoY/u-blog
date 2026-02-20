import Snowfall from './Snowfall.vue'
import { installSnowfall } from './plugin'

export { Snowfall, installSnowfall }
export { DEFAULT_MESSAGES } from './messages'
export type { SnowfallOptions, SnowflakeItem, FlakeState } from './types'

export default {
  install: installSnowfall
}
