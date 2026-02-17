import type { SelectOption } from '@/components/select'

export interface UMonthPickerProps {
  /** 当前年份 */
  year: number
  /** 当前月份（1–12） */
  month: number
  /** 可选年份列表（降序或升序均可，用于下拉） */
  yearOptions: number[]
  /** 月份选项，用于下拉；若不传则使用 1–12，label 由 slot 或默认数字 */
  monthOptions?: SelectOption[]
  /** 是否禁用「下一月」（如已到当前月） */
  disableNext?: boolean
  /** 尺寸，与 Select/Button 一致 */
  size?: 'small' | 'default' | 'large'
  /** 年月之间的分隔符 */
  separator?: string
  /** 年份 select 的 aria-label */
  ariaYearLabel?: string
  /** 月份 select 的 aria-label */
  ariaMonthLabel?: string
  /** 上一月按钮的 aria-label（用于无障碍与国际化） */
  prevMonthAriaLabel?: string
  /** 下一月按钮的 aria-label（用于无障碍与国际化） */
  nextMonthAriaLabel?: string
}

export interface UMonthPickerEmits {
  (e: 'update:year', value: number): void
  (e: 'update:month', value: number): void
  (e: 'prev'): void
  (e: 'next'): void
}
