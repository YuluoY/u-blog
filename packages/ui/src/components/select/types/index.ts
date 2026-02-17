import type { CSelectSize } from '../consts'

/** 选项：value 为实际值，label 为展示文案 */
export interface SelectOption {
  value: string | number
  label: string
}

/** 支持 options 为 { value, label }[] 或 (string | number)[]，后者以自身为 label */
export type SelectOptions = SelectOption[] | (string | number)[]

export type USelectSize = (typeof CSelectSize)[keyof typeof CSelectSize]

export interface USelectProps {
  /** 选项列表 */
  options?: SelectOptions
  /** 当前选中值（受控） */
  modelValue?: string | number
  /** 尺寸 */
  size?: USelectSize
  /** 是否禁用 */
  disabled?: boolean
  /** 占位文案（无选中时展示） */
  placeholder?: string
  /** 原生 id，用于 label[for] 与无障碍 */
  id?: string
  /** 原生 name */
  name?: string
  /** 无障碍标签 */
  ariaLabel?: string
}

export interface USelectEmits {
  (e: 'update:modelValue', value: string | number): void
  (e: 'change', value: string | number): void
  (e: 'focus', evt: FocusEvent): void
  (e: 'blur', evt: FocusEvent): void
}
