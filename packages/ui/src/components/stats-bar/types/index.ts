/**
 * 比例条单段配置：数值与可选颜色
 */
export interface UStatsBarSegment {
  value: number
  color?: string
  /** 可选，用于 title 等无障碍 */
  label?: string
}

export interface UStatsBarProps {
  /**
   * 各段数值，宽度按比例分配（相对总和或 max 归一化）
   * @default []
   */
  segments: UStatsBarSegment[]

  /**
   * 归一化基准：不传则用 segments 的 value 之和；传则按该 max 计算比例
   */
  max?: number

  /**
   * 条高度（含单位，如 '6px'、'0.5rem'）
   * @default '6px'
   */
  height?: string

  /**
   * 单段最小宽度百分比，避免为 0 时完全不可见
   * @default 5
   */
  segmentMinPct?: number

  /**
   * 轨道背景色（CSS 变量或颜色值）
   */
  trackColor?: string
}
