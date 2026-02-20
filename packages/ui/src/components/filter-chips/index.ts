import { withInstall, type SFCWithInstall } from '@/utils'
import FilterChips from './src/FilterChips.vue'

export * from './types'

export const UFilterChips: SFCWithInstall<typeof FilterChips> = withInstall(FilterChips)
