import { withInstall, type SFCWithInstall } from '@/utils'
import Tooltip from './src/Tooltip.vue'
import { CTooltipContainerId } from './consts'

export * from './types'
export * from './consts'

export const UTooltip: SFCWithInstall<typeof Tooltip> = withInstall(Tooltip, () => {
  if (document.getElementById(String(CTooltipContainerId))) return
  const el = document.createElement('div')
  el.id = String(CTooltipContainerId)
  el.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;z-index:2100;'
  document.body.appendChild(el)
})