import { h, render } from 'vue'
import type { UNotificationHandler, UNotificationParams, UNotificationProps, UNotificationPosition } from './types'
import { isString } from 'lodash-es'
import UNotificationSFC from './components/Notification.vue'
import { useZIndex } from '@u-blog/composables'

const { nextZIndex } = useZIndex()

/** 通知实例间的垂直间距（px） */
const GAP = 12

/** 跟踪每个方位的活跃通知实例 */
interface NotificationRecord {
  id: number
  container: HTMLElement
  vm: InstanceType<typeof UNotificationSFC>
  position: UNotificationPosition
  baseOffset: number
  /** 去重指纹：type + title + message（仅 string 类型） */
  fingerprint: string
}

// 按方位分组存储活跃实例
const instances = new Map<UNotificationPosition, NotificationRecord[]>([
  ['top-right', []],
  ['top-left', []],
  ['bottom-right', []],
  ['bottom-left', []],
])

let seed = 0

const defaultOptions: Partial<UNotificationProps> = {
  type: 'info',
  duration: 4500,
  position: 'top-right',
  offset: 16,
  deduplicate: false,
}

function normalizeOptions(options: UNotificationParams): UNotificationProps {
  if (!options) return defaultOptions as UNotificationProps
  if (isString(options)) {
    return { ...defaultOptions, message: options } as UNotificationProps
  }
  return { ...defaultOptions, ...options } as UNotificationProps
}

/** 生成去重指纹 */
function getFingerprint(props: UNotificationProps): string {
  const msg = typeof props.message === 'string' ? props.message : ''
  return `${props.type ?? ''}::${props.title ?? ''}::${msg}`
}

/**
 * 重新计算某个方位所有通知的 offset，实现堆叠排列
 */
function recalculate(position: UNotificationPosition, baseOffset: number) {
  const list = instances.get(position) ?? []
  let cumulative = baseOffset

  for (const record of list) {
    // 通过 exposed setOffset 动态更新偏移
    record.vm.setOffset(cumulative)

    // 累加当前通知高度 + 间距
    const el = record.container.querySelector('.u-notification') as HTMLElement | null
    if (el) {
      cumulative += el.offsetHeight + GAP
    }
  }
}

function NotificationFn(options: UNotificationParams = {}): UNotificationHandler {
  const props = normalizeOptions(options)
  const position = props.position ?? 'top-right'
  const baseOffset = props.offset ?? 16
  const list = instances.get(position) ?? []

  // ── 去重合并：匹配已有同内容通知，增加计数并重置定时器 ──
  if (props.deduplicate) {
    const fp = getFingerprint(props)
    const existing = list.find(r => r.fingerprint === fp)
    if (existing) {
      existing.vm.incrementRepeat()
      return { close: () => existing.vm.close() }
    }
  }

  const id = ++seed

  // 计算新通知的初始 offset
  let initialOffset = baseOffset
  for (const record of list) {
    const el = record.container.querySelector('.u-notification') as HTMLElement | null
    if (el) {
      initialOffset += el.offsetHeight + GAP
    }
  }

  const container = document.createElement('div')
  container.className = 'u-notification-container'
  document.body.appendChild(container)

  /** 销毁 DOM 并从队列中移除，触发剩余通知重排 */
  const destroy = () => {
    const idx = list.findIndex(r => r.id === id)
    if (idx !== -1) list.splice(idx, 1)
    render(null, container)
    container.remove()
    // 重算剩余通知位置
    recalculate(position, baseOffset)
  }

  const _props: UNotificationProps = {
    ...props,
    offset: initialOffset,
    zIndex: props.zIndex ?? nextZIndex(),
    onClose: () => {
      props.onClose?.()
      destroy()
    },
  }

  const vnode = h(UNotificationSFC, _props)
  render(vnode, container)

  const vm = vnode.component!

  // 记录实例
  const record: NotificationRecord = {
    id,
    container,
    vm: vm.exposed as any,
    position,
    baseOffset,
    fingerprint: getFingerprint(props),
  }
  list.push(record)

  return {
    close: () => vm.exposed!.close(),
  }
}

export default NotificationFn
