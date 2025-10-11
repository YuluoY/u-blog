import { withInstall, type SFCWithInstall } from '@/utils'
import Form from './src/Form.vue'
import FormItem from './src/FormItem.vue'
export * from './types'
export * from './consts'

export const UForm: SFCWithInstall<typeof Form> = withInstall<typeof Form>(Form)
export const UFormItem: SFCWithInstall<typeof FormItem> = withInstall<typeof FormItem>(FormItem)