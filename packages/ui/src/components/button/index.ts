import Button from './src/Button.vue'
import ButtonGroup from './src/ButtonGroup.vue'
import { withInstall, type SFCWithInstall } from '@/utils'

export * from './types'
export * from './consts'

export const UButton: SFCWithInstall<typeof Button> = withInstall<typeof Button>(Button)
export const UButtonGroup: SFCWithInstall<typeof ButtonGroup> = withInstall<typeof ButtonGroup>(ButtonGroup)
