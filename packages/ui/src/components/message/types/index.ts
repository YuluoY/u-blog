import type { Component, ComponentInternalInstance, Ref, VNode } from 'vue'
import type { CMessageType } from '../consts'

export type UMessageType = typeof CMessageType[keyof typeof CMessageType];

export interface UMessageProps {
  /**
   * @description 消息唯一标识
   * @type {string}
   * @default ''
   */
  id?: string
  
  /**
   * @description 消息内容
   * @type {string | VNode | Function}
   * @default ''
   */
  message?: string | VNode | Function

  /**
   * @description 消息类型
   * @type {string}
   * @default 'info'
   */
  type?: UMessageType

  /**
   * @description 是否纯色
   * @type {boolean}
   * @default false
   */
  plain?: boolean

  /**
   * @description 自定义图标，该属性会覆盖 type 的图标
   * @type {string | Component}
   */
  icon?: string | Component

  /**
   * @description 是否使用 HTML 片段
   * @type {boolean}
   * @default false
   */
  dangerouslyUseHTMLString?: boolean

  /**
   * @description 自定义类名
   * @type {string}
   * @default ''
   */
  customClass?: string

  /**
   * @description 显示时间，单位为毫秒，设置为0则不会自动关闭
   * @type {number}
   * @default 3000
   */
  duration?: number

  /**
   * @description 是否显示关闭按钮
   * @type {boolean}
   * @default false
   */
  showClose?: boolean

  /**
   * @description 文字是否居中
   * @type {boolean}
   * @default false
   */
  center?: boolean

  /**
   * @description 自定义 z-index
   * @type {number}
   * @default 1100
   */
  zIndex?: number

  /**
   * @description 关闭时的回调函数
   * @type {Function}
   * @default () => {}
   */
  onDestory?: () => void

  /**
   * @description 垂直偏移量
   * @type {number}
   * @default 16
   */
  offset?: number

  /**
   * @description 指定挂载的 DOM 节点，默认挂载到 body 上
   * @type {HTMLElement | string}
   * @default 'body'
   */
  appendTo?: HTMLElement | string

  /**
   * @description 合并内容相同的消息，不支持VNode类型的消息
   * @type {boolean}
   * @default false
   */
  grouping?: boolean

  /**
   * @description 消息重复出现次数，类似于Badge。和grouping配合使用
   * @type {number}
   * @default 1
   */
  repeatNum?: number

  /**
   * @description 过渡动画
   * @type {string}
   * @default 'fade-up'
   */
  transitionName?: string
}

export interface UMessageExposes {
  /**
   * @description 关闭消息
   */
  close: () => void

  /**
   * @description 消息的垂直偏移量
   * @type {import('vue').Ref<number>}
   * @default 16
   */
  bottomOffset: Ref<number>
}

export interface UMessageHandler {
  close: () => void
}

export type UMessageFn = {
  (props: UMessageParams): UMessageHandler
  closeAll: (type?: UMessageType) => void
}

export type UMessageTypeFn = (props: UMessageParams) => UMessageHandler

export interface UMessage extends UMessageFn {
  info: UMessageTypeFn
  success: UMessageTypeFn
  warning: UMessageTypeFn
  error: UMessageTypeFn
}

export type UMessageOptions = Partial<Omit<UMessageProps, 'id'>>
export type UMessageParams = string | VNode | UMessageOptions

export interface UMessageInstance {
  id: string
  vnode: VNode,
  props: UMessageProps
  vm: ComponentInternalInstance
  handler: UMessageHandler
}

export type ICreateMessageProps = Omit<UMessageProps, 'onDestory'>