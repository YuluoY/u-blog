import { withInstall, type SFCWithInstall } from '@/utils'
import Drawer from './src/Drawer.vue'

export * from './types'

export const UDrawer: SFCWithInstall<typeof Drawer> = withInstall<typeof Drawer>(Drawer)
