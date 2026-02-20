/**
 * 插件选项
 */
export interface SnowfallOptions {
  /** 雪花数量，默认 48 */
  count?: number
  /** 主题色列表（CSS 颜色值），用于雪花颜色随时间循环变化，默认使用常见主题色变量名 */
  themeColors?: string[]
  /** 悬停时显示的文案列表，随机展示 */
  messages?: string[]
  /** 顶层 z-index，默认 9998 */
  zIndex?: number
  /** 雪花尺寸范围 [min, max] 单位 px，默认 [4, 10] */
  sizeMin?: number
  sizeMax?: number
  /** 下落时长范围 [min, max] 单位秒，数值越大落得越慢，默认 [10, 20] */
  durationMin?: number
  durationMax?: number
  /** 水平分布 0=居中(50%)，100=全屏(0-100%)，默认 100 */
  distribution?: number
}

export interface SnowflakeItem {
  id: number
  left: number
  size: number
  duration: number
  delay: number
  colorPhase: number
}

export interface FlakeState extends SnowflakeItem {
  paused: boolean
  message: string
}
