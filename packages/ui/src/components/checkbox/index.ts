import { withInstall, type SFCWithInstall } from '@/utils'
import Checkbox from './src/Checkbox.vue'

export * from './types'
export * from './consts'

export const UCheckbox: SFCWithInstall<typeof Checkbox> = withInstall<typeof Checkbox>(Checkbox)
