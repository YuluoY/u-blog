/** 月历格：有日期时为 { day, dateStr }，占位格为 null */
export interface CalendarCell {
  day: number
  dateStr: string
}

export interface UCalendarGridProps {
  /** 表头星期标签（7 个，如 日/一/…/六） */
  dayLabels: string[]
  /** 格点列表：前若干项可为 null（月初空白），其余为 { day, dateStr } */
  cells: (CalendarCell | null)[]
  /** 当前选中日期 YYYY-MM-DD */
  selectedDate?: string | null
  /** 每日文章数，用于展示「有内容」样式 */
  dayCountMap?: Record<string, number>
  /** 点击某日回调 */
  onSelectDay?: (dateStr: string) => void
  /** 网格的 aria-label */
  ariaLabel?: string
  /** 文章数单位（用于无障碍文案，如「篇」） */
  articlesUnit?: string
}
