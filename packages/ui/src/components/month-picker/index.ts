import { withInstall, type SFCWithInstall } from '@/utils'
import MonthPicker from './src/MonthPicker.vue'

export * from './types'

export const UMonthPicker: SFCWithInstall<typeof MonthPicker> = withInstall<typeof MonthPicker>(MonthPicker)
