<!--
  CalendarGrid 月历网格：7 列表头 + 格点，与设计变量一致，支持选中态与「有内容」态。
-->
<template>
  <div class="u-calendar-grid" role="grid" :aria-label="ariaLabelValue">
    <span
      v-for="(d, idx) in dayLabels"
      :key="idx"
      class="u-calendar-grid__cell u-calendar-grid__cell--head"
    >
      {{ d }}
    </span>
    <template v-for="(cell, i) in cells" :key="i">
      <button
        v-if="cell"
        type="button"
        class="u-calendar-grid__cell u-calendar-grid__cell--day"
        :class="{
          'is-selected': selectedDate === cell.dateStr,
          'has-posts': (dayCountMap?.[cell.dateStr] ?? 0) > 0
        }"
        :aria-label="cellAriaLabel(cell)"
        @click="onSelectDay?.(cell.dateStr)"
      >
        {{ cell.day }}
        <span v-if="(dayCountMap?.[cell.dateStr] ?? 0) > 0" class="u-calendar-grid__dot" />
      </button>
      <span v-else class="u-calendar-grid__cell" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarCell, UCalendarGridProps } from '../types'

defineOptions({
  name: 'UCalendarGrid'
})

const props = withDefaults(defineProps<UCalendarGridProps>(), {
  selectedDate: null,
  dayCountMap: () => ({}),
  ariaLabel: 'Calendar',
  articlesUnit: 'posts'
})

const ariaLabelValue = computed(() => props.ariaLabel)

function cellAriaLabel(cell: CalendarCell): string {
  const count = props.dayCountMap?.[cell.dateStr] ?? 0
  return `${cell.dateStr}, ${count} ${props.articlesUnit}`
}
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
