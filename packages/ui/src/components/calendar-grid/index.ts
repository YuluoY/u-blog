import { withInstall, type SFCWithInstall } from '@/utils'
import CalendarGrid from './src/CalendarGrid.vue'

export * from './types'

export const UCalendarGrid: SFCWithInstall<typeof CalendarGrid> = withInstall<typeof CalendarGrid>(CalendarGrid)
