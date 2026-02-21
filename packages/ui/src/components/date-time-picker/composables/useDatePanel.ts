import { ref, computed, type Ref } from 'vue'
import type { DatePanelView, UDateTimePickerType } from '../types'

/** 日期面板核心状态机：管理 year→month→date 三级视图切换与翻页 */
export function useDatePanel(options: {
  type: Ref<UDateTimePickerType>
  initialYear: number
  initialMonth: number
}) {
  const { type, initialYear, initialMonth } = options

  /** 当前面板视图 */
  const currentView = ref<DatePanelView>(getInitialView(type.value))

  /** 面板浏览的年份 */
  const viewingYear = ref(initialYear)

  /** 面板浏览的月份（1-12） */
  const viewingMonth = ref(initialMonth)

  /** 年选择器的十年区间起始 */
  const decadeStart = computed(() => Math.floor(viewingYear.value / 10) * 10)

  /** 根据 type 决定初始视图 */
  function getInitialView(t: UDateTimePickerType): DatePanelView {
    if (t === 'year') return 'year'
    if (t === 'month') return 'month'
    return 'date'
  }

  /** 切换到年视图 */
  function showYearPicker() {
    currentView.value = 'year'
  }

  /** 切换到月视图 */
  function showMonthPicker() {
    currentView.value = 'month'
  }

  /** 切换到日视图 */
  function showDatePicker() {
    currentView.value = 'date'
  }

  /** 选择年份后 drill-down */
  function selectYear(year: number) {
    viewingYear.value = year
    if (type.value === 'year') return // 外部处理 emit
    currentView.value = 'month'
  }

  /** 选择月份后 drill-down */
  function selectMonth(month: number) {
    viewingMonth.value = month
    if (type.value === 'month') return // 外部处理 emit
    currentView.value = 'date'
  }

  /** 上一步翻页（年视图 -10, 其他 -1 年 或 -1 月） */
  function prevStep() {
    if (currentView.value === 'year') {
      viewingYear.value -= 10
    } else if (currentView.value === 'month') {
      viewingYear.value--
    } else {
      if (viewingMonth.value <= 1) {
        viewingYear.value--
        viewingMonth.value = 12
      } else {
        viewingMonth.value--
      }
    }
  }

  /** 下一步翻页 */
  function nextStep() {
    if (currentView.value === 'year') {
      viewingYear.value += 10
    } else if (currentView.value === 'month') {
      viewingYear.value++
    } else {
      if (viewingMonth.value >= 12) {
        viewingYear.value++
        viewingMonth.value = 1
      } else {
        viewingMonth.value++
      }
    }
  }

  /** 上翻年（date 视图下 -1 年） */
  function prevYear() {
    if (currentView.value === 'year') {
      viewingYear.value -= 10
    } else {
      viewingYear.value--
    }
  }

  /** 下翻年 */
  function nextYear() {
    if (currentView.value === 'year') {
      viewingYear.value += 10
    } else {
      viewingYear.value++
    }
  }

  /** 上翻月 */
  function prevMonth() {
    if (viewingMonth.value <= 1) {
      viewingYear.value--
      viewingMonth.value = 12
    } else {
      viewingMonth.value--
    }
  }

  /** 下翻月 */
  function nextMonth() {
    if (viewingMonth.value >= 12) {
      viewingYear.value++
      viewingMonth.value = 1
    } else {
      viewingMonth.value++
    }
  }

  /** 重置视图到初始状态 */
  function resetView() {
    currentView.value = getInitialView(type.value)
  }

  /** 跳至指定年月 */
  function navigateTo(year: number, month: number) {
    viewingYear.value = year
    viewingMonth.value = month
  }

  return {
    currentView,
    viewingYear,
    viewingMonth,
    decadeStart,
    showYearPicker,
    showMonthPicker,
    showDatePicker,
    selectYear,
    selectMonth,
    prevStep,
    nextStep,
    prevYear,
    nextYear,
    prevMonth,
    nextMonth,
    resetView,
    navigateTo
  }
}
