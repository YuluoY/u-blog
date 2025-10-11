import { withInstall, type SFCWithInstall } from '@/utils'
import Popconfirm from './src/Popconfirm.vue'

export * from './types'
export const UPopconfirm: SFCWithInstall<typeof Popconfirm> = withInstall<typeof Popconfirm>(Popconfirm)