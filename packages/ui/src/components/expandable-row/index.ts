import { withInstall, type SFCWithInstall } from '@/utils'
import ExpandableRow from './src/ExpandableRow.vue'

export * from './types'

export const UExpandableRow: SFCWithInstall<typeof ExpandableRow> = withInstall(ExpandableRow)
