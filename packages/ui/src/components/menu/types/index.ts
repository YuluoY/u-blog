import type { InjectionKey, Ref } from 'vue'

export type UMenuMode = 'horizontal' | 'vertical'

export interface UMenuCtx {
  activeIndex: Ref<string>
  mode: UMenuMode
  level: Ref<number>
  setActiveIndex: (index: string) => void
  getLevel: () => number
  addSubMenuLevel: (val: number) => void
}

export interface UMenuProps {
  /** 当前激活的菜单项 index */
  defaultActive?: string
  /** 模式：水平 / 垂直 */
  mode?: UMenuMode
  /** 是否支持多级菜单 */
  collapse?: boolean
}

export interface UMenuItemProps {
  /** 菜单项唯一标识 */
  index: string
  /** 是否禁用 */
  disabled?: boolean
}

export interface USubMenuProps {
  /** 子菜单唯一标识 */
  index: string
  /** 标题 */
  title?: string
  /** 是否禁用 */
  disabled?: boolean
}
