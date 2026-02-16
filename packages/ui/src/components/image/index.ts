import Image from './src/Image.vue'
import { withInstall, type SFCWithInstall } from '@/utils'

export * from './types'

export const UImage: SFCWithInstall<typeof Image> = withInstall<typeof Image>(Image)
