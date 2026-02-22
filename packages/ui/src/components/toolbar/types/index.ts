/** 工具条操作项定义 */
export interface UToolbarAction {
  /** 唯一标识 */
  key: string
  /** 显示文本 */
  label: string
  /** 图标名称（传入 UIcon） */
  icon?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否隐藏 */
  hidden?: boolean
}

/** UToolbar 尺寸 */
export type UToolbarSize = 'small' | 'default' | 'large'

/** UToolbar 布局方向 */
export type UToolbarDirection = 'horizontal' | 'vertical'

/** UToolbar Props */
export interface UToolbarProps {
  /** 操作项列表 */
  actions?: UToolbarAction[]
  /** 加载状态 */
  loading?: boolean
  /** 加载提示文字 */
  loadingText?: string
  /** 尺寸 */
  size?: UToolbarSize
  /** 布局方向 */
  direction?: UToolbarDirection
}

/** UToolbar Emits */
export interface UToolbarEmits {
  (e: 'action', key: string): void
}
