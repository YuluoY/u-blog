import Layout from './src/Layout.vue'
import Region from './src/Region.vue'
import { withInstall, type SFCWithInstall } from '@/utils'

export * from './types'
export * from './consts'
export * from './composables'

export const ULayout: SFCWithInstall<typeof Layout> = withInstall<typeof Layout>(Layout)
export const URegion: SFCWithInstall<typeof Region> = withInstall<typeof Region>(Region)