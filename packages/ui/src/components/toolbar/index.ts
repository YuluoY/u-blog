import { withInstall, type SFCWithInstall } from '@/utils'
import Toolbar from './src/Toolbar.vue'

export * from './types'
export * from './consts'

export const UToolbar: SFCWithInstall<typeof Toolbar> =
  withInstall<typeof Toolbar>(Toolbar)
