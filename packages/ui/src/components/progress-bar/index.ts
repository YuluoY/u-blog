import { withInstall, type SFCWithInstall } from '@/utils'
import ProgressBar from './src/ProgressBar.vue'

export * from './types'
export * from './consts'
export const UProgressBar: SFCWithInstall<typeof ProgressBar> = withInstall<typeof ProgressBar>(ProgressBar)
