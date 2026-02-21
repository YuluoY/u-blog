<!--
  DateTimePicker 日期时间选择器
  支持 date/datetime/month/year 4 种模式，year→month→date 逐级钻入，
  datetime 含 TimeSpinner 滚轮，支持 shortcuts、clearable、"今天/此刻"、确认按钮。
-->
<template>
  <div
    class="u-date-time-picker"
    :class="[
      `u-date-time-picker--${_size}`,
      { 'is-disabled': disabled, 'is-readonly': readonly }
    ]"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
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
      <!-- 触发器 -->
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
        <!-- 前缀日历图标（左侧，始终可见） -->
        <span class="u-date-time-picker__prefix" aria-hidden="true">
          <u-icon :icon="suffixIcon" />
        </span>
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
        <!-- 清除按钮（右侧，悬停时显示） -->
        <span
          v-if="showClearBtn"
          class="u-date-time-picker__clear"
          role="button"
          aria-label="清除"
          @click.stop="onClear"
        >
          <u-icon :icon="['fas', 'circle-xmark']" />
        </span>
      </div>

      <!-- 弹出面板 -->
      <template #content>
        <div class="u-date-time-picker__panel" @mousedown.prevent>
          <div class="u-date-time-picker__panel-layout">
            <!-- 快捷选项侧栏 -->
            <div v-if="shortcuts && shortcuts.length" class="u-dtp-shortcuts">
              <button
                v-for="(sc, i) in shortcuts"
                :key="i"
                type="button"
                class="u-dtp-shortcuts__item"
                @click="onShortcutClick(sc)"
              >
                {{ sc.text }}
              </button>
            </div>

            <div class="u-date-time-picker__panel-main">
              <!-- 年面板 -->
              <YearPanel
                v-if="currentView === 'year'"
                :start-year="panel.decadeStart.value"
                :selected-year="selectedYear"
                :disabled-date="disabledDate"
                @select="onYearSelect"
                @prev-decade="panel.prevStep()"
                @next-decade="panel.nextStep()"
              />
              <!-- 月面板 -->
              <MonthPanel
                v-else-if="currentView === 'month'"
                :year="viewingYear"
                :selected-year="selectedYear"
                :selected-month="selectedMonth"
                :disabled-date="disabledDate"
                @select="onMonthSelect"
                @prev-year="panel.prevYear()"
                @next-year="panel.nextYear()"
                @show-year="panel.showYearPicker()"
              />
              <!-- 日面板 -->
              <DatePanel
                v-else
                :year="viewingYear"
                :month="viewingMonth"
                :selected-date="selectedDateStr"
                :disabled-date="disabledDate"
                :min="min"
                :max="max"
                @select="onDateSelect"
                @prev-year="panel.prevYear()"
                @next-year="panel.nextYear()"
                @prev-month="panel.prevMonth()"
                @next-month="panel.nextMonth()"
                @show-year="panel.showYearPicker()"
                @show-month="panel.showMonthPicker()"
              />

              <!-- datetime 模式：时间滚轮 -->
              <div v-if="type === 'datetime' && currentView === 'date'" class="u-dtp-time-section">
                <div class="u-dtp-time-section__divider" />
                <TimeSpinner
                  ref="timeSpinnerRef"
                  :hour="timeHour"
                  :minute="timeMinute"
                  :second="timeSecond"
                  :show-seconds="showSeconds"
                  @update:hour="timeHour = $event"
                  @update:minute="timeMinute = $event"
                  @update:second="timeSecond = $event"
                />
              </div>
            </div>
          </div>

          <!-- 底部操作栏 -->
          <div v-if="showFooter" class="u-dtp-footer">
            <button
              v-if="showNow !== false"
              type="button"
              class="u-dtp-footer__now-btn"
              @click="onNowClick"
            >
              {{ type === 'datetime' ? '此刻' : '今天' }}
            </button>
            <span class="u-dtp-footer__spacer" />
            <button
              v-if="needConfirm"
              type="button"
              class="u-dtp-footer__confirm-btn"
              @click="onConfirm"
            >
              确定
            </button>
          </div>
        </div>
      </template>
    </UTooltip>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch, useId, nextTick } from 'vue'
import type { UDateTimePickerEmits, UDateTimePickerProps, DatePickerShortcut, DatePanelView } from '../types'
import { UIcon } from '@/components/icon'
import { UTooltip } from '@/components/tooltip'
import { FORM_ITEM_SIZE_INJECTION_KEY } from '@/components/form'
import { useDatePanel } from '../composables/useDatePanel'
import YearPanel from './YearPanel.vue'
import MonthPanel from './MonthPanel.vue'
import DatePanel from './DatePanel.vue'
import TimeSpinner from './TimeSpinner.vue'

/* ---------- 工具函数 ---------- */

/** 将 modelValue 字符串解析为日期各部分 */
function parseValue(v: string, type: string): { y: number; m: number; d: number; h: number; min: number; s: number } {
  if (!v) {
    const now = new Date()
    return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate(), h: now.getHours(), min: now.getMinutes(), s: now.getSeconds() }
  }
  if (type === 'year') return { y: Number(v) || new Date().getFullYear(), m: 1, d: 1, h: 0, min: 0, s: 0 }
  if (type === 'month') {
    const [y, m] = v.split('-').map(Number)
    return { y: y || new Date().getFullYear(), m: m || 1, d: 1, h: 0, min: 0, s: 0 }
  }
  const date = new Date(v)
  if (isNaN(date.getTime())) {
    const now = new Date()
    return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate(), h: 0, min: 0, s: 0 }
  }
  return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate(), h: date.getHours(), min: date.getMinutes(), s: date.getSeconds() }
}

/** 格式化显示值 */
function formatDisplay(v: string, type: string, fmt?: string): string {
  if (!v) return ''
  if (type === 'year') return v
  if (type === 'month') return v
  if (fmt) {
    const d = new Date(v)
    if (isNaN(d.getTime())) return v
    return fmt
      .replace('YYYY', String(d.getFullYear()))
      .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
      .replace('DD', String(d.getDate()).padStart(2, '0'))
      .replace('HH', String(d.getHours()).padStart(2, '0'))
      .replace('mm', String(d.getMinutes()).padStart(2, '0'))
      .replace('ss', String(d.getSeconds()).padStart(2, '0'))
  }
  if (type === 'date') return v
  const d = new Date(v)
  if (isNaN(d.getTime())) return v
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

/** 将年月日时分秒拼成 modelValue 字符串 */
function buildValue(y: number, m: number, d: number, h: number, min: number, s: number, type: string, showSec: boolean): string {
  if (type === 'year') return String(y)
  if (type === 'month') return `${y}-${String(m).padStart(2, '0')}`
  const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  if (type === 'date') return dateStr
  const timeStr = showSec
    ? `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  return `${dateStr}T${timeStr}`
}

/* ---------- 组件定义 ---------- */

defineOptions({ name: 'UDateTimePicker' })

const props = withDefaults(defineProps<UDateTimePickerProps>(), {
  modelValue: '',
  type: 'datetime',
  size: 'default',
  clearable: true,
  showNow: true,
  showConfirm: true,
  showSeconds: false
})

const emit = defineEmits<UDateTimePickerEmits>()

/* ---------- 基础状态 ---------- */

const fallbackId = `u-date-time-picker-${useId()}`
const inputId = computed(() => props.id ?? fallbackId)

const formItemSize = inject(FORM_ITEM_SIZE_INJECTION_KEY, null)
const _size = computed(() => formItemSize?.value ?? props.size)

const tooltipRef = ref<{ hide: () => void } | null>(null)
const triggerRef = ref<HTMLDivElement | null>(null)
const timeSpinnerRef = ref<InstanceType<typeof TimeSpinner> | null>(null)
const panelVisible = ref(false)
const hovering = ref(false)

/* ---------- 面板导航 ---------- */

/** 初始视图：根据 type 决定；date/datetime → 'date'，month → 'month'，year → 'year' */
const initialView = computed<DatePanelView>(() => {
  if (props.type === 'year') return 'year'
  if (props.type === 'month') return 'month'
  return 'date'
})

const panel = useDatePanel({
  type: computed(() => props.type),
  initialYear: parseValue(props.modelValue, props.type).y,
  initialMonth: parseValue(props.modelValue, props.type).m
})

const {
  currentView,
  viewingYear,
  viewingMonth
} = panel

/* ---------- 选中状态 ---------- */

const parsed = computed(() => parseValue(props.modelValue || '', props.type))

const selectedDateStr = ref('')
const selectedYear = ref(parsed.value.y)
const selectedMonth = ref(parsed.value.m)
const timeHour = ref(parsed.value.h)
const timeMinute = ref(parsed.value.min)
const timeSecond = ref(parsed.value.s)

/** 同步外部 modelValue → 内部状态 */
watch(
  () => props.modelValue,
  (v) => {
    const p = parseValue(v || '', props.type)
    viewingYear.value = p.y
    viewingMonth.value = p.m
    selectedYear.value = p.y
    selectedMonth.value = p.m
    timeHour.value = p.h
    timeMinute.value = p.min
    timeSecond.value = p.s
    if (props.type === 'date' || props.type === 'datetime') {
      selectedDateStr.value = v && v.length >= 10 ? v.slice(0, 10) : ''
    }
  },
  { immediate: true }
)

/* ---------- 显示 ---------- */

const displayValue = computed(() => formatDisplay(props.modelValue, props.type, props.format))

const suffixIcon = computed(() => {
  if (props.type === 'year' || props.type === 'month') return ['fas', 'calendar']
  return ['fas', props.type === 'date' ? 'calendar-day' : 'calendar']
})

const showClearBtn = computed(() =>
  props.clearable && !props.disabled && !props.readonly && hovering.value && !!props.modelValue
)

const needConfirm = computed(() => props.type === 'datetime' && props.showConfirm !== false)

const showFooter = computed(() => {
  if (props.showNow !== false) return true
  return needConfirm.value
})

const popperOptions = computed(() => ({
  modifiers: [{ name: 'offset', options: { offset: [0, 4] } }]
}))

/* ---------- 事件处理 ---------- */

function onPanelVisibleChange(visible: boolean) {
  panelVisible.value = visible
  emit('visible-change', visible)
  if (visible) {
    // 每次打开时重置视图到初始级别
    panel.resetView()
    const p = parseValue(props.modelValue || '', props.type)
    viewingYear.value = p.y
    viewingMonth.value = p.m
    nextTick(() => timeSpinnerRef.value?.syncScroll(false))
  } else {
    emit('blur', new FocusEvent('blur'))
  }
}

function onTriggerFocus(evt: FocusEvent) {
  emit('focus', evt)
}

function onTriggerBlur() {
  // panel mousedown.prevent 阻止了 blur 导致的面板关闭
}

function onClear() {
  emit('update:modelValue', '')
  emit('change', '')
  emit('clear')
  tooltipRef.value?.hide?.()
}

/** 发射当前选中值并关闭面板 */
function emitAndClose(value: string) {
  emit('update:modelValue', value)
  emit('change', value)
  tooltipRef.value?.hide?.()
}

/** 发射当前选中值（不关闭面板） */
function emitValue(value: string) {
  emit('update:modelValue', value)
  emit('change', value)
}

/* ---------- 年选择 ---------- */

function onYearSelect(year: number) {
  selectedYear.value = year
  if (props.type === 'year') {
    emitAndClose(String(year))
    return
  }
  // drill-down 到月
  panel.selectYear(year)
  emit('panel-change', new Date(year, 0), 'month')
}

/* ---------- 月选择 ---------- */

function onMonthSelect(month: number) {
  selectedMonth.value = month
  if (props.type === 'month') {
    emitAndClose(`${viewingYear.value}-${String(month).padStart(2, '0')}`)
    return
  }
  // drill-down 到日
  panel.selectMonth(month)
  emit('panel-change', new Date(viewingYear.value, month - 1), 'date')
}

/* ---------- 日选择 ---------- */

function onDateSelect(dateStr: string) {
  selectedDateStr.value = dateStr
  const [y, m, d] = dateStr.split('-').map(Number)
  selectedYear.value = y
  selectedMonth.value = m
  if (props.type === 'date') {
    emitAndClose(dateStr)
    return
  }
  // datetime 模式：选中日期后发射值但不关闭（让用户选时间、点确认）
  const value = buildValue(y, m, d, timeHour.value, timeMinute.value, timeSecond.value, props.type, props.showSeconds)
  emitValue(value)
}

/* ---------- 快捷选项 ---------- */

function onShortcutClick(sc: DatePickerShortcut) {
  const date = typeof sc.value === 'function' ? sc.value() : sc.value
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  const h = date.getHours()
  const min = date.getMinutes()
  const s = date.getSeconds()
  const value = buildValue(y, m, d, h, min, s, props.type, props.showSeconds)
  emitAndClose(value)
}

/* ---------- 今天/此刻 ---------- */

function onNowClick() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const d = now.getDate()
  const h = now.getHours()
  const min = now.getMinutes()
  const s = now.getSeconds()
  const value = buildValue(y, m, d, h, min, s, props.type, props.showSeconds)
  if (props.type === 'datetime') {
    // 此刻：直接确认并关闭
    emitAndClose(value)
  } else {
    emitAndClose(value)
  }
}

/* ---------- 确认按钮（datetime） ---------- */

function onConfirm() {
  if (!selectedDateStr.value) {
    // 未选日期则用今天
    const now = new Date()
    selectedDateStr.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }
  const [y, m, d] = selectedDateStr.value.split('-').map(Number)
  const value = buildValue(y, m, d, timeHour.value, timeMinute.value, timeSecond.value, props.type, props.showSeconds)
  emitAndClose(value)
}
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
