/** 日期输入框组件：支持仅日期(date)或日期+时间(datetime-local)，样式与 Input 一致 */
export type UDateTimePickerType = 'date' | 'datetime'

export interface UDateTimePickerProps {
  /** 值：date 为 yyyy-MM-dd，datetime 为 yyyy-MM-ddThh:mm */
  modelValue?: string
  /** 仅日期 或 日期+时间 */
  type?: UDateTimePickerType
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  /** 最小日期/时间，格式同 modelValue */
  min?: string
  /** 最大日期/时间，格式同 modelValue */
  max?: string
  /** 尺寸，与 FormItem 联动 */
  size?: 'small' | 'default' | 'large'
  /** 原生 id */
  id?: string
  /** 无障碍描述 */
  ariaLabel?: string
  /** 原生 name */
  name?: string
}

export interface UDateTimePickerEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'focus', evt: FocusEvent): void
  (e: 'blur', evt: FocusEvent): void
}
