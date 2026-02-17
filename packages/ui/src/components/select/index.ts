import { withInstall, type SFCWithInstall } from '@/utils'
import Select from './src/Select.vue'

export * from './types'
export * from './consts'

export const USelect: SFCWithInstall<typeof Select> = withInstall<typeof Select>(Select)
