import type { VNode, Component } from 'vue'

export interface UDialogProps {
  /**
   * @description 是否显示
   * @type {boolean}
   * @default false
   */
  modelValue?: boolean

  /**
   * @description 标题
   * @type {string}
   * @default ''
   */
  title?: string

  /**
   * @description 内容。string 走 v-html；其余走 <component :is="component" />（支持组件、VNode、渲染函数）
   * @default ''
   */
  component?: VNode | Component | string | (() => VNode)

  /**
   * @description 宽度
   * @type {number}
   * @default ''
   */
  width?: number

  /**
   * @description 高度
   * @type {number}
   * @default ''
   */
  height?: number

  /**
   * @description 是否需要遮罩层
   * @type {boolean}
   * @default true
   */
  modal?: boolean

  /**
   * @description 遮罩层自定义类名
   * @type {string}
   * @default ''
   */
  modalClass?: string

  /**
   * @description 关闭图标
   * @type {string}
   * @default ''
   */
  closeIcon?: string | string[]

  /**
   * @description 折叠图标
   * @type {string | string[]}
   * @default ''
   */
  collapseIcon?: string | string[]

  /**
   * @description 容器元素
   * @type {string | HTMLElement}
   * @default 'body'
   */
  appendTo?: string | HTMLElement

  /**
   * @description 打开延时
   * @type {number}
   * @default 0
   */
  openDelay?: number

  /**
   * @description 关闭延时
   * @type {number}
   * @default 0
   */
  closeDelay?: number

  /**
   * @description 是否可以点击遮罩层关闭
   * @type {boolean}
   * @default true
   */
  closeOnClickModal?: boolean

  /**
   * @description 是否可以使用ESC按键关闭
   * @type {boolean}
   * @default true
   */
  closeOnPressEscape?: boolean

  /**
   * @description 是否显示折叠按钮
   * @type {boolean}
   * @default false
   */
  showCollapseIcon?: boolean

  /**
   * @description 是否显示关闭按钮
   * @type {boolean}
   * @default true
   */
  showCloseIcon?: boolean

  /**
   * @description 层级
   * @type {number}
   * @default 2000
   */
  zIndex?: number

  /**
   * @description 是否显示底部按钮
   * @type {boolean}
   * @default true
   */
  showFooter?: boolean

  /**
   * @description 是否限制拖拽范围
   * @type {boolean}
   * @default false
   */
  isLimitBounds?: boolean
}

export interface UDialogEmits {
  /**
   * @description 显示/隐藏状态改变时触发
   * @param   {boolean} value
   * @returns {void}
   */
  (e: 'update:modelValue', value: boolean): void

  /**
   * @description 打开/关闭时触发
   * @returns {void}
   */
  (e: 'open'): void

  /**
   * @description 折叠时触发
   * @param {boolean} value
   * @returns {void}
   */
  (e: 'collapse', value: boolean): void

  /**
   * @description 点击确认按钮触发
   * @returns {void}
   */
  (e: 'confirm', callback: () => void): void

  /**
   * @description 点击取消按钮触发
   * @returns {void}
   */
  (e: 'cancel'): void

  /**
   * @description 点击遮罩层触发
   * @returns {void}
   */
  (e: 'click-modal'): void
}

export interface UDialogExposes {
  /**
   * @description 打开弹窗
   */
  open: () => void

  /**
   * @description 关闭弹窗
   */
  close: () => void

  /**
   * @description 折叠弹窗
   */
  collapse: () => void

  /**
   * @description 重置弹窗位置
   */
  resetPosition: () => void
}