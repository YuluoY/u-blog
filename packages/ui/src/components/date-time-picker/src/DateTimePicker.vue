<!--
  日期输入框：自定义弹出面板，使用主题变量以跟随网站主题；date 仅日期，datetime 含时间。
-->
<template>
  <div
    class="u-date-time-picker"
    :class="[
      `u-date-time-picker--${_size}`,
      { 'is-disabled': disabled, 'is-readonly': readonly }
    ]"
  >
    <UTooltip
      ref="tooltipRef"
      trigger="click"
      placement="bottom-start"
      :padding="0"
      :disabled="disabled || readonly"
      :popper-class="'u-date-time-picker__popper'"
      :popper-options="popperOptions"
      @visible-change="onPanelVisibleChange"
    >
      <div
        ref="triggerRef"
        class="u-date-time-picker__wrapper"
        :id="inputId"
        role="combobox"
        :aria-expanded="panelVisible"
        :aria-haspopup="'dialog'"
        :aria-label="ariaLabel"
        :aria-disabled="disabled"
      >
        <input
          :value="displayValue"
          type="text"
          class="u-date-time-picker__inner"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="true"
          :name="name"
          :aria-label="ariaLabel"
          @focus="onTriggerFocus"
          @blur="onTriggerBlur"
        />
        <span class="u-date-time-picker__suffix" aria-hidden="true">
          <u-icon :icon="['fas', type === 'date' ? 'calendar-day' : 'calendar']" />
        </span>
      </div>
      <template #content>
        <div class="u-date-time-picker__panel" @mousedown.prevent>
          <div class="u-date-time-picker__panel-head">
            <button
              type="button"
              class="u-date-time-picker__nav"
              aria-label="上一月"
              @click="prevMonth"
            >
              <u-icon :icon="['fas', 'chevron-left']" />
            </button>
            <span class="u-date-time-picker__panel-title">{{ viewingYear }} / {{ viewingMonth }}</span>
            <button
              type="button"
              class="u-date-time-picker__nav"
              aria-label="下一月"
              @click="nextMonth"
            >
              <u-icon :icon="['fas', 'chevron-right']" />
            </button>
          </div>
          <div class="u-date-time-picker__panel-body">
            <UCalendarGrid
              :day-labels="dayLabels"
              :cells="monthCells"
              :selected-date="selectedDateStr"
              :aria-label="ariaLabel"
              :on-select-day="onSelectDay"
            />
            <div v-if="type === 'datetime'" class="u-date-time-picker__time">
              <input
                v-model.number="timeHour"
                type="number"
                class="u-date-time-picker__time-input"
                min="0"
                max="23"
                :aria-label="'时'"
                @change="emitFromTime"
              />
              <span class="u-date-time-picker__time-sep">:</span>
              <input
                v-model.number="timeMinute"
                type="number"
                class="u-date-time-picker__time-input"
                min="0"
                max="59"
                :aria-label="'分'"
                @change="emitFromTime"
              />
            </div>
          </div>
        </div>
      </template>
    </UTooltip>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch, useId } from 'vue'
import type { CalendarCell } from '@/components/calendar-grid'
import type { UDateTimePickerEmits, UDateTimePickerProps } from '../types'
import { UIcon } from '@/components/icon'
import { UCalendarGrid } from '@/components/calendar-grid'
import { UTooltip } from '@/components/tooltip'
import { FORM_ITEM_SIZE_INJECTION_KEY } from '@/components/form'

const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

function getMonthCells(year: number, month: number): (CalendarCell | null)[] {
  const first = new Date(year, month - 1, 1)
  const last = new Date(year, month, 0)
  const startPad = first.getDay()
  const days = last.getDate()
  const cells: (CalendarCell | null)[] = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= days; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, dateStr })
  }
  return cells
}

function parseValue(v: string): { y: number; m: number; d: number; h: number; min: number } {
  const d = v ? new Date(v) : new Date()
  return {
    y: d.getFullYear(),
    m: d.getMonth() + 1,
    d: d.getDate(),
    h: d.getHours(),
    min: d.getMinutes()
  }
}

defineOptions({
  name: 'UDateTimePicker'
})

const props = withDefaults(defineProps<UDateTimePickerProps>(), {
  modelValue: '',
  type: 'datetime',
  size: 'default'
})

const emit = defineEmits<UDateTimePickerEmits>()

const fallbackId = `u-date-time-picker-${useId()}`
const inputId = computed(() => props.id ?? fallbackId)

const formItemSize = inject(FORM_ITEM_SIZE_INJECTION_KEY, null)
const _size = computed(() => formItemSize?.value ?? props.size)

const tooltipRef = ref<{ hide: () => void } | null>(null)
const triggerRef = ref<HTMLDivElement | null>(null)
const panelVisible = ref(false)

const dayLabels = DAY_LABELS

const parsed = computed(() => parseValue(props.modelValue || ''))

const viewingYear = ref(parsed.value.y)
const viewingMonth = ref(parsed.value.m)
const selectedDateStr = ref<string>(
  props.type === 'date' && props.modelValue
    ? props.modelValue
    : props.modelValue && props.modelValue.length >= 10
      ? props.modelValue.slice(0, 10)
      : ''
)
const timeHour = ref(parsed.value.h)
const timeMinute = ref(parsed.value.min)

watch(
  () => props.modelValue,
  (v) => {
    const p = parseValue(v || '')
    viewingYear.value = p.y
    viewingMonth.value = p.m
    if (props.type === 'date' && v) selectedDateStr.value = v
    else if (v && v.length >= 10) selectedDateStr.value = v.slice(0, 10)
    else selectedDateStr.value = ''
    timeHour.value = p.h
    timeMinute.value = p.min
  },
  { immediate: true }
)

const monthCells = computed(() => getMonthCells(viewingYear.value, viewingMonth.value))

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  if (props.type === 'date') return props.modelValue
  const d = new Date(props.modelValue)
  if (isNaN(d.getTime())) return props.modelValue
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}/${m}/${day} ${h}:${min}`
})

const popperOptions = computed(() => ({
  modifiers: [{ name: 'offset', options: { offset: [4, 0] } }]
}))

function onPanelVisibleChange(visible: boolean) {
  panelVisible.value = visible
  if (!visible) emit('blur', new FocusEvent('blur'))
}

function onTriggerFocus(evt: FocusEvent) {
  emit('focus', evt)
}

function onTriggerBlur() {
  // 点击面板时 trigger 会 blur，由 panel 的 mousedown.prevent 避免收起后再 focus 回来
}

function prevMonth() {
  if (viewingMonth.value <= 1) {
    viewingYear.value--
    viewingMonth.value = 12
  } else {
    viewingMonth.value--
  }
}

function nextMonth() {
  if (viewingMonth.value >= 12) {
    viewingYear.value++
    viewingMonth.value = 1
  } else {
    viewingMonth.value++
  }
}

function onSelectDay(dateStr: string) {
  selectedDateStr.value = dateStr
  if (props.type === 'date') {
    emit('update:modelValue', dateStr)
    emit('change', dateStr)
    tooltipRef.value?.hide?.()
    return
  }
  const next = `${dateStr}T${String(timeHour.value).padStart(2, '0')}:${String(timeMinute.value).padStart(2, '0')}`
  emit('update:modelValue', next)
  emit('change', next)
}

function emitFromTime() {
  const date = selectedDateStr.value || `${viewingYear.value}-${String(viewingMonth.value).padStart(2, '0')}-01`
  const h = Math.min(23, Math.max(0, Number(timeHour.value) || 0))
  const min = Math.min(59, Math.max(0, Number(timeMinute.value) || 0))
  timeHour.value = h
  timeMinute.value = min
  const next = `${date}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  emit('update:modelValue', next)
  emit('change', next)
}
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
