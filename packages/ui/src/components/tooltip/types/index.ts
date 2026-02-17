import type { Ref, TransitionProps } from 'vue'
import type { CTooltipEffect, CTooltipTrigger } from '../consts'
import type { Placement, Options } from '@popperjs/core'

export type UTooltipEffect = typeof CTooltipEffect[keyof typeof CTooltipEffect];
export type UTooltipTrigger = typeof CTooltipTrigger[keyof typeof CTooltipTrigger];

export interface UTooltipProps {
  /**
   * @description 指定Tooltip挂载的DOM节点
   * @type {string | HTMLElement}
   */
  appendTo?: string | HTMLElement

  /**
   * @description 提示框主题
   * @type {UTooltipEffect}
   */
  effect?: UTooltipEffect

  /**
   * @description 提示内容
   * @type {string}
   */
  content?: string

  /**
   * @description 是否使用原生html
   * @type {boolean}
   */
  rawContent?: boolean

  /**
   * @description 弹出位置
   * @type {Placement}
   */
  placement?: Placement

  /**
   * @description 是否显示（受控，不传则由 trigger 控制）
   * @type {boolean}
   */
  visible?: boolean

  /**
   * @description 是否禁用
   * @type {boolean}
   */
  disabled?: boolean

  /**
   * @description 偏移量
   * @type {number}
   */
  offset?: number

  /**
   * @description 延迟显示，单位为毫秒
   * @type {number}
   */
  showTimeout?: number

  /**
   * @description 延迟关闭，单位为毫秒
   * @type {number}
   */
  hideTimeout?: number

  /**
   * @description 是否显示箭头
   * @type {boolean}
   */
  showArrow?: boolean

  /**
   * @description 自动关闭时间，单位为毫秒
   * @type {number}
   */
  autoCloseTimeout?: number

  /**
   * @description 给Tooltip的popper添加类名
   * @type {string}
   */
  popperClass?: string

  /**
   * @description popper.js的配置项
   * @type {Partial<Options>}
   */
  popperOptions?: Partial<Options>

  /**
   * @description 触发方式
   * @type {UTooltipTrigger}
   */
  trigger?: UTooltipTrigger

  /**
   * @description 是否使用虚拟触发器
   * @type {boolean}
   */
  virtualTriggering?: boolean

  /**
   * @description 虚拟触发器
   * @type {Ref<HTMLElement> | HTMLElement | null}
   */
  virtualRef?: Ref<HTMLElement> | HTMLElement | null

  /**
   * @description 触发器键值
   * @type {string[]}
   */
  triggerKeys?: string[]

  /**
   * @description 是否持久显示，当组件长时间不被触发且为false时，popconfirm会被删除
   * @type {boolean}
   */
  persistent?: boolean

  /**
   * @description 提示框的aria-label属性
   * @type {string}
   */
  ariaLabel?: string

  /**
   * @description 过渡动画
   * @type {string}
   */
  transition?: string

  /**
   * @description 是否手动控制显示状态
   * @type {boolean}
   */
  manual?: boolean

  /**
   * @description 内边距
   * @type {number}
   */
  padding?: number

  /**
   * @description 宽度
   * @type {number}
   */
  width?: number

  /**
   * @description 弹出框圆角（单位 rem，如 0.5 表示 0.5rem）
   * @type {number}
   */
  borderRadius?: number

  /**
   * @description 弹出框字号（单位 rem，不传则使用 --u-font-size-sm）
   * @type {number}
   */
  fontSize?: number

  /**
   * @description 过渡动画配置
   * @type {TransitionProps}
   */
  transitionProps?: TransitionProps
}

export interface UTooltipEmits {
  /**
   * @description 显示状态改变时触发
   * @param {boolean} value
   */
  (e: 'visible-change', value: boolean): void

  /**
   * @description 点击外部时触发
   */
  (e: 'click-outside'): void
  
  /**
   * @description 更新visible状态
   * @param {boolean} value
   */
  (e: 'update:visible', value: boolean): void
}

export interface UTooltipExposes {
  /**
   * @description el-popper 组件实例
   */
  popperRef: Ref

  /**
   * @description el-tooltip-content 组件实例
   */
  contentRef: Ref

  /**
   * @description 当前焦点事件是否在tooltip-content中触发
   * @type {boolean | undefined}
   */
  isFocusInsideContent: () => boolean | undefined

  updatePopper: () => void

  /**
   * @description 打开tooltip
   * @param {Event | undefined} evt
   */
  onOpen: (evt?: Event | undefined) => void

  /**
   * @description 关闭tooltip
   * @param {Event | undefined} evt
   */
  onClose: (evt?: Event | undefined) => void

  /**
   * @description 隐藏tooltip
   * @param {Event | undefined} evt
   */
  hide: (evt?: Event | undefined) => void
}