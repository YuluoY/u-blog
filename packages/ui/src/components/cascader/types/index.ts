import type { CCascaderSize, CCascaderExpandTrigger } from '../consts'

/** 级联选项节点 */
export interface CascaderOption {
  /** 选项值 */
  value: string | number
  /** 显示文本 */
  label: string
  /** 子级选项 */
  children?: CascaderOption[]
  /** 是否禁用 */
  disabled?: boolean
}

/** 级联选择器尺寸类型 */
export type UCascaderSize = (typeof CCascaderSize)[keyof typeof CCascaderSize]

/** 展开子级的触发方式类型 */
export type UCascaderExpandTrigger = (typeof CCascaderExpandTrigger)[keyof typeof CCascaderExpandTrigger]

/** 级联选择器 modelValue：各级选中值组成的路径数组 */
export type CascaderModelValue = (string | number)[]

/** UCascader 组件 Props */
export interface UCascaderProps {
  /** 级联选项树 */
  options?: CascaderOption[]
  /** 选中值路径 [level0, level1, ...] */
  modelValue?: CascaderModelValue
  /** 占位文本 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 可清除 */
  clearable?: boolean
  /** 尺寸 */
  size?: UCascaderSize
  /** 展开子级的触发方式 */
  expandTrigger?: UCascaderExpandTrigger
  /** 值变化时是否自动收起面板（仅当选中叶子节点时） */
  closeOnSelect?: boolean
  /** 各级之间的分隔符 */
  separator?: string
  /** 无障碍相关 */
  id?: string
  name?: string
  ariaLabel?: string
  /** 是否允许选择任意层级（非叶子也可选），默认 false 只能选叶子 */
  changeOnSelect?: boolean
}

/** UCascader 组件 Emits */
export interface UCascaderEmits {
  (e: 'update:modelValue', value: CascaderModelValue): void
  (e: 'change', value: CascaderModelValue): void
  (e: 'focus', evt: FocusEvent): void
  (e: 'blur', evt: FocusEvent): void
  (e: 'clear'): void
}
