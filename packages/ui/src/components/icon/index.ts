import { withInstall, type SFCWithInstall } from '@/utils'
import Icon from './src/Icon.vue'
export * from './types'
export * from './consts'

export const UIcon: SFCWithInstall<typeof Icon> = withInstall<typeof Icon>(Icon)
