import { withInstall, type SFCWithInstall } from '@/utils'
import Top from './src/Top.vue'

export * from './types'
export * from './consts'
export const UTop: SFCWithInstall<typeof Top> = withInstall<typeof Top>(Top)