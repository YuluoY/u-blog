import Menu from './src/Menu.vue'
import MenuItem from './src/MenuItem.vue'
import SubMenu from './src/SubMenu.vue'
import { withInstall, type SFCWithInstall } from '@/utils'

export * from './types'
export * from './consts'

export const UMenu: SFCWithInstall<typeof Menu> = withInstall<typeof Menu>(Menu)
export const UMenuItem: SFCWithInstall<typeof MenuItem> = withInstall<typeof MenuItem>(MenuItem)
export const USubMenu: SFCWithInstall<typeof SubMenu> = withInstall<typeof SubMenu>(SubMenu)
