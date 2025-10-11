import { withInstall, type SFCWithInstall } from '@/utils'
import ConfigProvider from './src/ConfigProvider.vue'

export * from './types'
export * from './consts'
export * from './composables'

export const UConfigProvider: SFCWithInstall<typeof ConfigProvider> = withInstall<typeof ConfigProvider>(ConfigProvider)
