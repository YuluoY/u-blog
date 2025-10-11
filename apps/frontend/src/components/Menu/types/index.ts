import type { UMenuType } from './const'

export interface UMenuProps {
  /**
   * @description 菜单类型
   * @type {UMenuType}
   */
  type?: UMenuType

  /**
   * @description 默认选中的路由
   * @type {string}
   */
  defaultActive?: string
}

export interface UMenuItemProps {
  /**
   * @description 路由
   * @type {string}
   */
  route?: string
}

export interface USubMenuProps {
  /**
   * @description 标题
   * @type {string}
   */
  title?: string
}

export interface UMenuContext {
  /**
   * @description 菜单类型
   * @type {UMenuType}
   */
  type?: UMenuType

  /**
   * @description 默认选中的路由
   * @type {string}
   */
  defaultActive?: string
}
