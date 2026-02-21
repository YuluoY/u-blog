import type { CSelectSize } from '../consts'

/** 选项：value 为实际值，label 为展示文案 */
export interface SelectOption {
  value: string | number
  label: string
}

/** 支持 options 为 { value, label }[] 或 (string | number)[]，后者以自身为 label */
export type SelectOptions = SelectOption[] | (string | number)[]

export type USelectSize = (typeof CSelectSize)[keyof typeof CSelectSize]

/** 单选值 或 多选值数组 */
export type SelectModelValue = string | number | (string | number)[]

export interface USelectProps {
  /** 选项列表 */
  options?: SelectOptions
  /** 当前选中值（单选为 string|number，多选为 (string|number)[]） */
  modelValue?: SelectModelValue
  /** 是否开启多选模式 */
  multiple?: boolean
  /** 多选时触发器区域最多展示的 tag 数量，超出部分显示 +N（0 = 不限） */
  maxTagCount?: number
  /** 多选 tag 是否可关闭（默认 true） */
  tagClosable?: boolean
  /** 尺寸 */
  size?: USelectSize
  /** 是否禁用 */
  disabled?: boolean
  /** 占位文案（无选中时展示） */
  placeholder?: string
  /**
   * 下拉框宽度是否严格贴合触发器（true：width=触发器，选项过长省略号；false：minWidth=触发器，选项可撑开）
   * 参考 Element Plus fitInputWidth，默认 true
   */
  fitInputWidth?: boolean
  /** 原生 id，用于 label[for] 与无障碍 */
  id?: string
  /** 原生 name */
  name?: string
  /** 无障碍标签 */
  ariaLabel?: string
  /** 是否可清空（鼠标悬停时显示清除按钮） */
  clearable?: boolean
}

export interface USelectEmits {
  (e: 'update:modelValue', value: SelectModelValue): void
  (e: 'change', value: SelectModelValue): void
  (e: 'focus', evt: FocusEvent): void
  (e: 'blur', evt: FocusEvent): void
  /** 多选模式下移除某个 tag 时触发 */
  (e: 'remove-tag', value: string | number): void
  /** 点击清除按钮时触发 */
  (e: 'clear'): void
}
