import { withInstall, withInstallFunc, type SFCWithInstall } from '@/utils'
import Dialog from './src/Dialog.vue'
import { CGlobal } from '@/components/constants'
import DialogFn from './methods'
export * from './types'
export * from './consts'

export const UDialog: SFCWithInstall<typeof Dialog> = withInstall<typeof Dialog>(Dialog)
export const UDialogFn = withInstallFunc(DialogFn, CGlobal.DIALOG)