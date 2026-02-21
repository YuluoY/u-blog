import { withInstall, type SFCWithInstall } from '@/utils'
import Cascader from './src/Cascader.vue'

export * from './types'
export * from './consts'

export const UCascader: SFCWithInstall<typeof Cascader> = withInstall<typeof Cascader>(Cascader)
