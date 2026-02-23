import { withInstall, type SFCWithInstall } from '@/utils'
import BackTop from './src/BackTop.vue'

export * from './types'
export * from './consts'
export const UBackTop: SFCWithInstall<typeof BackTop> = withInstall<typeof BackTop>(BackTop)
