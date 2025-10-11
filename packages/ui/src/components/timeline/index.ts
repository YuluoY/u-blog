import Timeline from './src/Timeline.vue'
import TimelineItem from './src/TimelineItem.vue'
import { withInstall, type SFCWithInstall } from '@/utils'

export * from './types'
export * from './consts'

export const UTimeline: SFCWithInstall<typeof Timeline> = withInstall<typeof Timeline>(Timeline)
export const UTimelineItem: SFCWithInstall<typeof TimelineItem> = withInstall<typeof TimelineItem>(TimelineItem)