<!--
  MonthPanel 月选择面板：12 个月网格，支持年翻页与选中高亮。
-->
<template>
  <div class="u-dtp-month-panel">
    <div class="u-dtp-month-panel__header">
      <button type="button" class="u-dtp-nav-btn" aria-label="上一年" @click="$emit('prev-year')">
        <u-icon :icon="['fas', 'angles-left']" />
      </button>
      <button type="button" class="u-dtp-month-panel__title" @click="$emit('show-year')">
        {{ year }}
      </button>
      <button type="button" class="u-dtp-nav-btn" aria-label="下一年" @click="$emit('next-year')">
        <u-icon :icon="['fas', 'angles-right']" />
      </button>
    </div>
    <div class="u-dtp-month-panel__grid">
      <button
        v-for="m in 12"
        :key="m"
        type="button"
        class="u-dtp-month-panel__cell"
        :class="{
          'is-selected': m === selectedMonth && year === selectedYear,
          'is-current': m === currentMonth && year === currentYearValue,
          'is-disabled': isMonthDisabled(m)
        }"
        :disabled="isMonthDisabled(m)"
        @click="!isMonthDisabled(m) && $emit('select', m)"
      >
        {{ monthLabels[m - 1] }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UIcon } from '@/components/icon'

defineOptions({ name: 'UDateTimePickerMonthPanel' })

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const props = defineProps<{
  year: number
  selectedYear?: number
  selectedMonth?: number
  monthLabels?: string[]
  disabledDate?: (date: Date) => boolean
}>()

defineEmits<{
  (e: 'select', month: number): void
  (e: 'prev-year'): void
  (e: 'next-year'): void
  (e: 'show-year'): void
}>()

const now = new Date()
const currentMonth = now.getMonth() + 1
const currentYearValue = now.getFullYear()
const monthLabels = props.monthLabels ?? MONTH_LABELS

/** 检查某月是否整月被禁用 */
function isMonthDisabled(month: number): boolean {
  if (!props.disabledDate) return false
  const lastDay = new Date(props.year, month, 0).getDate()
  const start = new Date(props.year, month - 1, 1)
  const end = new Date(props.year, month - 1, lastDay)
  return props.disabledDate(start) && props.disabledDate(end)
}
</script>
