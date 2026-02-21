export interface UCheckboxProps {
  /** 是否选中 */
  modelValue?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 半选状态（如全选下的部分选中） */
  indeterminate?: boolean
  /** 原生 name，用于表单分组 */
  name?: string
  /** 原生 id，便于 label[for] */
  id?: string
  /** 无障碍描述 */
  ariaLabel?: string
  /** 尺寸 */
  size?: 'small' | 'default' | 'large'
  /** 是否显示边框 */
  border?: boolean
}

export interface UCheckboxEmits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}
