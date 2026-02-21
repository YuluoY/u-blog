<!--
  DatePanel 日选择面板：月历网格 + 头部导航（可 drill-up 到年/月视图），支持 disabledDate、today 高亮。
-->
<template>
  <div class="u-dtp-date-panel">
    <div class="u-dtp-date-panel__header">
      <button type="button" class="u-dtp-nav-btn" aria-label="上一年" @click="$emit('prev-year')">
        <u-icon :icon="['fas', 'angles-left']" />
      </button>
      <button type="button" class="u-dtp-nav-btn" aria-label="上一月" @click="$emit('prev-month')">
        <u-icon :icon="['fas', 'chevron-left']" />
      </button>
      <div class="u-dtp-date-panel__title-group">
        <button type="button" class="u-dtp-date-panel__title" @click="$emit('show-year')">
          {{ year }}年
        </button>
        <button type="button" class="u-dtp-date-panel__title" @click="$emit('show-month')">
          {{ month }}月
        </button>
      </div>
      <button type="button" class="u-dtp-nav-btn" aria-label="下一月" @click="$emit('next-month')">
        <u-icon :icon="['fas', 'chevron-right']" />
      </button>
      <button type="button" class="u-dtp-nav-btn" aria-label="下一年" @click="$emit('next-year')">
        <u-icon :icon="['fas', 'angles-right']" />
      </button>
    </div>
    <div class="u-dtp-date-panel__body">
      <!-- 星期标题行 -->
      <div class="u-dtp-date-panel__weekdays">
        <span v-for="(d, i) in dayLabels" :key="i" class="u-dtp-date-panel__weekday">{{ d }}</span>
      </div>
      <!-- 日期网格 -->
      <div class="u-dtp-date-panel__grid">
        <template v-for="(cell, i) in cells" :key="i">
          <button
            v-if="cell"
            type="button"
            class="u-dtp-date-panel__cell"
            :class="{
              'is-selected': cell.dateStr === selectedDate,
              'is-today': cell.dateStr === todayStr,
              'is-disabled': isCellDisabled(cell.dateStr)
            }"
            :disabled="isCellDisabled(cell.dateStr)"
            :aria-label="cell.dateStr"
            @click="!isCellDisabled(cell.dateStr) && $emit('select', cell.dateStr)"
          >
            {{ cell.day }}
          </button>
          <span v-else class="u-dtp-date-panel__cell u-dtp-date-panel__cell--empty" />
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
/** 星期标题默认值（需在 setup 外定义以便 defineProps default 引用） */
const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

interface DateCell {
  day: number
  dateStr: string
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { UIcon } from '@/components/icon'

defineOptions({ name: 'UDateTimePickerDatePanel' })

const props = withDefaults(defineProps<{
  year: number
  month: number
  selectedDate?: string
  dayLabels?: string[]
  disabledDate?: (date: Date) => boolean
  min?: string
  max?: string
}>(), {
  dayLabels: () => DAY_LABELS
})

defineEmits<{
  (e: 'select', dateStr: string): void
  (e: 'prev-year'): void
  (e: 'next-year'): void
  (e: 'prev-month'): void
  (e: 'next-month'): void
  (e: 'show-year'): void
  (e: 'show-month'): void
}>()

const todayStr = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})()

const dayLabels = computed(() => props.dayLabels)

/** 生成月历格子 */
const cells = computed((): (DateCell | null)[] => {
  const first = new Date(props.year, props.month - 1, 1)
  const last = new Date(props.year, props.month, 0)
  const startPad = first.getDay()
  const days = last.getDate()
  const result: (DateCell | null)[] = []
  for (let i = 0; i < startPad; i++) result.push(null)
  for (let d = 1; d <= days; d++) {
    const dateStr = `${props.year}-${String(props.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    result.push({ day: d, dateStr })
  }
  return result
})

/** 检查日期是否被禁用（disabledDate + min/max） */
function isCellDisabled(dateStr: string): boolean {
  const date = new Date(dateStr)
  if (props.disabledDate?.(date)) return true
  if (props.min) {
    const minDate = new Date(props.min)
    minDate.setHours(0, 0, 0, 0)
    if (date < minDate) return true
  }
  if (props.max) {
    const maxDate = new Date(props.max)
    maxDate.setHours(23, 59, 59, 999)
    if (date > maxDate) return true
  }
  return false
}
</script>
