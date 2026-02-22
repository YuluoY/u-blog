import { withInstall, type SFCWithInstall } from '@/utils'
import FloatingToolbar from './src/FloatingToolbar.vue'

export * from './types'
export * from './consts'

export const UFloatingToolbar: SFCWithInstall<typeof FloatingToolbar> =
  withInstall<typeof FloatingToolbar>(FloatingToolbar)
