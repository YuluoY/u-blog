export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom'

export interface UDrawerProps {
  modelValue?: boolean
  placement?: DrawerPlacement
  title?: string
  width?: number | string
  height?: number | string
  appendTo?: string | HTMLElement
  modal?: boolean
  closeOnClickModal?: boolean
  closeOnPressEscape?: boolean
  showCloseIcon?: boolean
  zIndex?: number
}

export interface UDrawerEmits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'open'): void
  (e: 'close'): void
}

export interface UDrawerExposes {
  close: () => void
}
