import { h, isVNode, render, shallowReactive, useId } from 'vue'
import type {
  ICreateMessageProps,
  UMessage,
  UMessageFn,
  UMessageHandler,
  UMessageInstance,
  UMessageParams,
  UMessageProps,
} from './types'
import { each, findIndex, get, isString, set } from 'lodash-es'
import UMessageSFC from './components/Message.vue'
import { CMessageType } from './consts'
import { useZIndex } from '@u-blog/composables'
import type { UMessageType } from './types'

const { nextZIndex } = useZIndex()
const instances: UMessageInstance[] = shallowReactive([])
const defaultOptions: ICreateMessageProps = {
  type: 'info',
  duration: 3000,
  offset: 10,
  transitionName: 'fade-up'
}

const normalizeOptions = (options: UMessageParams): ICreateMessageProps =>
{
  if (!options) {
    return defaultOptions
  }
  if (isVNode(options) || isString(options)) {
    return { ...defaultOptions, message: options }
  }
  return { ...defaultOptions, ...options }
}

const createMessage = (props: ICreateMessageProps): UMessageInstance =>
{
  const id = useId()
  const container = document.createElement('div')
  const destroy = () =>
  {
    const idx = findIndex(instances, { id })
    if (idx === -1) return
    instances.splice(idx, 1)
    render(null, container)
  }
  const _props: UMessageProps = {
    ...props,
    id,
    zIndex: nextZIndex(),
    onDestroy: destroy
  }

  const vnode = h(UMessageSFC, _props)
  render(vnode, container)
  // document.body.appendChild(container.firstElementChild!)

  const vm = vnode.component!
  const handler: UMessageHandler = {
    close: () => vm.exposed!.close()
  }

  const instance = {
    id,
    props: _props,
    handler,
    vm,
    vnode
  }
  return instance
}

export const MessageFn: UMessageFn & Partial<UMessage> = (options = {}): UMessageHandler =>
{
  options = normalizeOptions(options)
  const instance = createMessage(options)
  instances.push(instance)
  return instance.handler
}

export function getLastBottomOffset(this: UMessageProps)
{
  const idx = findIndex(instances, { id: this.id })
  if (idx <= 0) return 0
  return get(instances, [idx - 1, 'vm', 'exposed', 'bottomOffset', 'value'])
}

// 将设置的type覆盖默认的type
each(CMessageType, type => set(MessageFn, type, (opts = {}) => MessageFn({ ...normalizeOptions(opts), type })))

export function closeAll(type?: UMessageType)
{
  each(instances, ins =>
  {
    if (ins.props.type === type)
    {
      ins.handler.close()
      return
    }
    ins.handler.close()
  })
}

MessageFn.closeAll = closeAll
export default MessageFn as UMessage