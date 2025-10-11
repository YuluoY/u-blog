import { withInstall, type SFCWithInstall } from '@/utils'
import Slider from './src/Slider.vue'

export * from './types'
export * from './consts'

export const USlider: SFCWithInstall<typeof Slider> = withInstall<typeof Slider>(Slider)