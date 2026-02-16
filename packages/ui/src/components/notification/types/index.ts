import type { VNode } from 'vue'

export type UNotificationPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

export interface UNotificationProps {
  title?: string
  message?: string | VNode
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
  position?: UNotificationPosition
  offset?: number
  zIndex?: number
  onClose?: () => void
}

export interface UNotificationHandler {
  close: () => void
}

export type UNotificationParams = string | Partial<UNotificationProps>
