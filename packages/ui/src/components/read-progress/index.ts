import { withInstall, withInstallFunc, type SFCWithInstall } from '@/utils'
import ReadProgress from './src/ReadProgress.vue'
import { CGlobal } from '../constants'
import ReadProgressFn from './methods'

export * from './types'
export * from './consts'

export const UReadProgress: SFCWithInstall<typeof ReadProgress> = withInstall<typeof ReadProgress>(ReadProgress)
export const UReadProgressFn = withInstallFunc(ReadProgressFn, CGlobal.PROGRESS)