/** UToolbar 默认尺寸 */
export const CToolbarDefaultSize = 'default' as const

/** UToolbar 默认布局方向 */
export const CToolbarDefaultDirection = 'horizontal' as const

/** 尺寸 → 内边距映射 (px) */
export const CToolbarSizePaddingMap = {
  small: { bar: 2, btn: [4, 6] },
  default: { bar: 4, btn: [6, 10] },
  large: { bar: 6, btn: [8, 14] },
} as const
