export interface UMenuCtx {
  
  /**
   * 获取当前菜单层级
   */
  getLevel: () => number

  /**
   * 增加子菜单层级 - subMenu
   * @param val 增加的层级
   */
  addSubMenuLevel: (val: number) => void
}

