import { withInstall, type SFCWithInstall } from '@/utils'
import DateTimePicker from './src/DateTimePicker.vue'

export * from './types'

export const UDateTimePicker: SFCWithInstall<typeof DateTimePicker> =
  withInstall<typeof DateTimePicker>(DateTimePicker)
