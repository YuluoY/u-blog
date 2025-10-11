import { withInstall, type SFCWithInstall } from '@/utils'
import Tooltip from './src/Tooltip.vue'
import { CTooltipContainerId } from './consts'
import { h, render } from 'vue'

export * from './types'
export * from './consts'

export const UTooltip: SFCWithInstall<typeof Tooltip> = withInstall(Tooltip, _ =>
{
  return render(h('div', {id: String(CTooltipContainerId)}), document.body)
})