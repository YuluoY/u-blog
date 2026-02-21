<!--
  YearPanel 年选择面板：10 年为一组的网格选择，支持翻页与选中高亮。
-->
<template>
  <div class="u-dtp-year-panel">
    <div class="u-dtp-year-panel__header">
      <button type="button" class="u-dtp-nav-btn" aria-label="上一个十年" @click="$emit('prev-decade')">
        <u-icon :icon="['fas', 'angles-left']" />
      </button>
      <span class="u-dtp-year-panel__title">{{ startYear }} - {{ startYear + 9 }}</span>
      <button type="button" class="u-dtp-nav-btn" aria-label="下一个十年" @click="$emit('next-decade')">
        <u-icon :icon="['fas', 'angles-right']" />
      </button>
    </div>
    <div class="u-dtp-year-panel__grid">
      <button
        v-for="year in yearList"
        :key="year"
        type="button"
        class="u-dtp-year-panel__cell"
        :class="{
          'is-selected': year === selectedYear,
          'is-current': year === currentYear,
          'is-outside': year < startYear || year > startYear + 9,
          'is-disabled': isYearDisabled(year)
        }"
        :disabled="isYearDisabled(year)"
        @click="!isYearDisabled(year) && $emit('select', year)"
      >
        {{ year }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { UIcon } from '@/components/icon'

defineOptions({ name: 'UDateTimePickerYearPanel' })

const props = defineProps<{
  startYear: number
  selectedYear?: number
  disabledDate?: (date: Date) => boolean
}>()

defineEmits<{
  (e: 'select', year: number): void
  (e: 'prev-decade'): void
  (e: 'next-decade'): void
}>()

const currentYear = new Date().getFullYear()

/** 生成 12 个年份（前1 + 10 + 后1），前后为相邻区间灰色展示 */
const yearList = computed(() => {
  const list: number[] = []
  for (let i = -1; i <= 10; i++) {
    list.push(props.startYear + i)
  }
  return list
})

/** 检查某年是否整年被禁用 */
function isYearDisabled(year: number): boolean {
  if (!props.disabledDate) return false
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)
  return props.disabledDate(start) && props.disabledDate(end)
}
</script>
