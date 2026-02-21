import { withInstall, type SFCWithInstall } from '@/utils'
import Upload from './src/Upload.vue'

export * from './types'
export const UUpload: SFCWithInstall<typeof Upload> = withInstall<typeof Upload>(Upload)
