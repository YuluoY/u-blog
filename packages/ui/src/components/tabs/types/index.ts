export interface TabOption {
  key: string
  label: string
  /** 可选图标（如 fa-solid fa-palette），与 label 一起展示为「图标+文字」 */
  icon?: string
  disabled?: boolean
}

export interface UTabsProps {
  /**
   * 当前激活的 tab key
   */
  modelValue?: string
  /**
   * 受控时的当前激活 key
   */
  activeKey?: string
  /**
   * tab 配置（用于等宽分布，不传则用默认 slot）
   */
  tabs?: TabOption[]
}

export interface UTabsEmits {
  (e: 'update:modelValue', key: string): void
  (e: 'tab-change', key: string): void
}

export interface UTabPaneProps {
  /** 对应 tabs 的 key */
  key: string
  /** 是否禁用 */
  disabled?: boolean
  /** 标签文案（若用 tabs prop 可省略） */
  label?: string
}
