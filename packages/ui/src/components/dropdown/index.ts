import Dropdown from './src/Dropdown.vue'
import DropdownMenu from './src/DropdownMenu.vue'
import DropdownItem from './src/DropdownItem.vue'
import { withInstall, type SFCWithInstall } from '@/utils'

export * from './types'
export * from './consts'
export * from './composables'

export const UDropdown: SFCWithInstall<typeof Dropdown> = withInstall<typeof Dropdown> (Dropdown)
export const UDropdownMenu: SFCWithInstall<typeof DropdownMenu> = withInstall<typeof DropdownMenu>(DropdownMenu)
export const UDropdownItem: SFCWithInstall<typeof DropdownItem> = withInstall<typeof DropdownItem>(DropdownItem)
