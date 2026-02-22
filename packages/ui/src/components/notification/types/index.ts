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
  /** 相同内容去重：为 true 时，重复通知不再新建，而是在已有通知上显示 ×N 计数徽标 */
  deduplicate?: boolean
  onClose?: () => void
}

export interface UNotificationHandler {
  close: () => void
}

export type UNotificationParams = string | Partial<UNotificationProps>
