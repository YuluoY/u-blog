import { h, render, useId } from 'vue'
import type { UNotificationHandler, UNotificationParams, UNotificationProps } from './types'
import { isString } from 'lodash-es'
import UNotificationSFC from './components/Notification.vue'
import { useZIndex } from '@u-blog/composables'

const { nextZIndex } = useZIndex()

const defaultOptions: Partial<UNotificationProps> = {
  type: 'info',
  duration: 4500,
  position: 'top-right',
  offset: 16
}

function normalizeOptions(options: UNotificationParams): UNotificationProps {
  if (!options) return defaultOptions as UNotificationProps
  if (isString(options)) {
    return { ...defaultOptions, message: options } as UNotificationProps
  }
  return { ...defaultOptions, ...options } as UNotificationProps
}

function NotificationFn(options: UNotificationParams = {}): UNotificationHandler {
  const props = normalizeOptions(options)
  const id = useId()
  const container = document.createElement('div')
  container.className = 'u-notification-container'
  document.body.appendChild(container)

  const destroy = () => {
    render(null, container)
    container.remove()
  }

  const _props: UNotificationProps = {
    ...props,
    zIndex: props.zIndex ?? nextZIndex(),
    onClose: () => {
      props.onClose?.()
      destroy()
    }
  }

  const vnode = h(UNotificationSFC, _props)
  render(vnode, container)

  const vm = vnode.component!
  return {
    close: () => vm.exposed!.close()
  }
}

export default NotificationFn
