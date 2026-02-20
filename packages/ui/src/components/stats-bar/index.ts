import { withInstall, type SFCWithInstall } from '@/utils'
import StatsBar from './src/StatsBar.vue'

export * from './types'

export const UStatsBar: SFCWithInstall<typeof StatsBar> = withInstall(StatsBar)
