import { withInstall, type SFCWithInstall } from '@/utils'
import Input from './src/Input.vue'
import InputNumber from './src/InputNumber.vue'

export * from './types'
export * from './consts'

export const UInput: SFCWithInstall<typeof Input> = withInstall<typeof Input>(Input)
export const UInputNumber: SFCWithInstall<typeof InputNumber> = withInstall<typeof InputNumber>(InputNumber)