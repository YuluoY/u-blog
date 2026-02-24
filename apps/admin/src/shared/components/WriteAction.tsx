import { type ReactNode } from 'react'
import { useGuestMode } from '../../contexts/GuestModeContext'

/**
 * 写操作容器：游客只读模式下自动隐藏子元素
 *
 * 用于包裹新增、编辑、删除、导出等操作按钮，
 * 当 isGuest 为 true 时不渲染任何内容。
 */
export function WriteAction({ children }: { children: ReactNode }) {
  const { isGuest } = useGuestMode()
  if (isGuest) return null
  return <>{children}</>
}
