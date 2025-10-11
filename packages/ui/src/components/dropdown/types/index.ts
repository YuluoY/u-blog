import type { Component, ComputedRef } from 'vue'
import type { UButtonProps, UTooltipProps, UIconProps } from '@/components'

export interface UDropdownProps {

  /**
   * 下拉菜单的数据
   * @type {UDropdownItemProps[]}
   */
  data?: UDropdownItemProps[]

  /**
   * 下拉菜单的类型
   * @type {string}
   * @default 'default'
   */
  type?: UButtonProps['type']

  /**
   * 下拉菜单的尺寸
   * @type {string}
   * @default 'default'
   */
  size?: UButtonProps['size']

  /**
   * 菜单最大高度
   * @type {number}
   */
  maxHeight?: number

  /**
   * 下拉触发元素呈现为按钮组
   * @type {boolean}
   * @default false
   */
  splitButton?: boolean

  /**
   * 下拉菜单是否禁用
   * @type {boolean}
   * @default false
   */
  disabled?: boolean

  /**
   * 下拉菜单的弹出位置
   * @type {UTooltipProps['placement']}
   * @default 'bottom'
   */
  placement?: UTooltipProps['placement']

  /**
   * 触发下拉的行为
   * @type {UTooltipProps['trigger']}
   * @default 'hover'
   */
  trigger?: UTooltipProps['trigger']

  /**
   * 点击菜单项后是否隐藏菜单
   * @type {boolean}
   * @default true
   */
  hideOnClick?: boolean

  /**
   * 菜单显示延时
   * @type {number}
   * @default 150
   */
  showTimeout?: number

  /**
   * 菜单隐藏延时
   * @type {number}
   * @default 150
   */
  hideTimeout?: number

  /**
   * 下拉菜单ARIA属性。根据具体场景，可能想要更改为'navigation;
   * @type {string}
   * @default 'menu'
   */
  role?: string

  /**
   * 下拉菜单的tabindex属性
   * @type {number}
   * @default 0
   */
  tabindex?: number

  /**
   * 下拉菜单的tooltip属性
   * @type {UTooltipProps}
   */
  tooltipProps?: Omit<UTooltipProps, 'visible'>

  /**
   * 下拉菜单是否被挂载到body上
   * @type {boolean}
   * @default false
   */
  teleported?: boolean
}

export interface UDropdownEmits {
  /**
   * 点击菜单项时触发
   * @param {any} args
   */
  (e: 'command', ...args: any[]): void

  /**
   * 点击菜单项后是否隐藏菜单
   * @param {boolean} val
   */
  (e: 'visible-change', val: boolean): void

  /**
   * 点击事件
   * @param {MouseEvent} evt
   */
  (e: 'click', evt: MouseEvent): void
}

export interface UDropdownExposes {
  /**
   * 手动显示下拉菜单
   */
  doShow: () => void

  /**
   * 手动隐藏下拉菜单
   */
  doHide: () => void
}

export interface UDropdownItemProps {

  /**
   * 菜单项的文本
   * @type {string}
   */
  label?: string
  
  /**
   * 菜单项的命令
   * @type {string | number | object}
   */
  command?: string | number | object

  /**
   * 菜单项是否禁用
   * @type {boolean}
   * @default false
   */
  disabled?: boolean

  /**
   * 菜单项是否显示分割线
   * @type {boolean}
   * @default false
   */
  divided?: boolean

  /**
   * 菜单项的图标
   * @type {string | Component}
   */
  icon?: string | Component

  /**
   * 菜单项的图标属性
   * @type {UIconProps}
   */
  iconProps?: UIconProps
}

export interface UDropdownCtx {
  handleItemClick(item: UDropdownItemProps): void
  size: ComputedRef<UDropdownProps['size'] | void>
}