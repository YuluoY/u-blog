import { withInstall } from '@/utils'
import Tabs from './src/Tabs.vue'
import TabPane from './src/TabPane.vue'
export * from './types'

export const UTabs = withInstall(Tabs)
export const UTabPane = withInstall(TabPane)
