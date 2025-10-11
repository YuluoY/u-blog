import { withInstall, type SFCWithInstall } from '@/utils'
import Collapse from './src/Collapse.vue'
import CollapseItem from './src/CollapseItem.vue'

export * from './types'
export * from './consts'
export const UCollapse: SFCWithInstall<typeof Collapse> = withInstall<typeof Collapse>(Collapse)
export const UCollapseItem: SFCWithInstall<typeof CollapseItem> = withInstall<typeof CollapseItem>(CollapseItem)