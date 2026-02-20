/**
 * 单个芯片项，用于 UFilterChips 与 UTag 的 closable 展示
 */
export interface UFilterChipItem {
  key: string
  label: string
  /** 传给 u-tag 的 type，如 'primary' */
  tagType?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  /** 传给 u-tag 的 color */
  color?: string
}

export interface UFilterChipsProps {
  /**
   * 左侧说明文案
   * @default ''
   */
  label?: string

  /**
   * 芯片列表
   * @default []
   */
  chips?: UFilterChipItem[]

  /**
   * 清空按钮文案，为空则不显示清空按钮
   * @default ''
   */
  clearText?: string
}

export interface UFilterChipsEmits {
  (e: 'close', chip: UFilterChipItem): void
  (e: 'clear'): void
}
