import { withInstall, type SFCWithInstall } from '@/utils'
import Text from './src/Text.vue'

export * from './types' 
export * from './consts'

export const UText: SFCWithInstall<typeof Text> = withInstall<typeof Text>(Text)