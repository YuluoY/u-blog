/** 日期选择器支持的类型模式 */
export type UDateTimePickerType = 'date' | 'datetime' | 'month' | 'year'

/** 快捷选项 */
export interface DatePickerShortcut {
  /** 显示文本 */
  text: string
  /** 值或返回值的函数 */
  value: Date | (() => Date)
}

export interface UDateTimePickerProps {
  /** 值：date→yyyy-MM-dd，datetime→yyyy-MM-ddTHH:mm，month→yyyy-MM，year→yyyy */
  modelValue?: string
  /** 选择模式 */
  type?: UDateTimePickerType
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  /** 最小可选日期（格式同 modelValue） */
  min?: string
  /** 最大可选日期（格式同 modelValue） */
  max?: string
  /** 尺寸，与 FormItem 联动 */
  size?: 'small' | 'default' | 'large'
  /** 原生 id */
  id?: string
  /** 无障碍描述 */
  ariaLabel?: string
  /** 原生 name */
  name?: string
  /** 是否显示清除按钮（默认 true） */
  clearable?: boolean
  /** 显示格式（如 YYYY/MM/DD HH:mm），默认根据 type 自动推导 */
  format?: string
  /** 禁用日期判断函数 */
  disabledDate?: (date: Date) => boolean
  /** 快捷选项 */
  shortcuts?: DatePickerShortcut[]
  /** 是否显示"今天/此刻"按钮（默认 true） */
  showNow?: boolean
  /** datetime 模式下是否显示确认按钮（默认 true） */
  showConfirm?: boolean
  /** 面板打开时的默认日期 */
  defaultValue?: Date
  /** 是否显示秒选择列（仅 datetime，默认 false） */
  showSeconds?: boolean
}

export interface UDateTimePickerEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'focus', evt: FocusEvent): void
  (e: 'blur', evt: FocusEvent): void
  (e: 'clear'): void
  (e: 'panel-change', date: Date, view: 'year' | 'month' | 'date'): void
  (e: 'visible-change', visible: boolean): void
}

/** 面板视图状态 */
export type DatePanelView = 'year' | 'month' | 'date'
