<!--
  TimeSpinner 时间滚轮选择器：三列（时/分/秒）滚轮，scroll-snap 对齐，点击选中居中高亮
-->
<template>
  <div class="u-dtp-time-spinner">
    <!-- 时 -->
    <div class="u-dtp-time-spinner__column" ref="hourCol">
      <ul class="u-dtp-time-spinner__list" @scroll="onHourScroll">
        <li class="u-dtp-time-spinner__pad" />
        <li
          v-for="h in 24"
          :key="h - 1"
          class="u-dtp-time-spinner__item"
          :class="{ 'is-selected': h - 1 === hour }"
          @click="selectHour(h - 1)"
        >
          {{ String(h - 1).padStart(2, '0') }}
        </li>
        <li class="u-dtp-time-spinner__pad" />
      </ul>
    </div>
    <!-- 分 -->
    <div class="u-dtp-time-spinner__column" ref="minuteCol">
      <ul class="u-dtp-time-spinner__list" @scroll="onMinuteScroll">
        <li class="u-dtp-time-spinner__pad" />
        <li
          v-for="m in 60"
          :key="m - 1"
          class="u-dtp-time-spinner__item"
          :class="{ 'is-selected': m - 1 === minute }"
          @click="selectMinute(m - 1)"
        >
          {{ String(m - 1).padStart(2, '0') }}
        </li>
        <li class="u-dtp-time-spinner__pad" />
      </ul>
    </div>
    <!-- 秒（可选） -->
    <div v-if="showSeconds" class="u-dtp-time-spinner__column" ref="secondCol">
      <ul class="u-dtp-time-spinner__list" @scroll="onSecondScroll">
        <li class="u-dtp-time-spinner__pad" />
        <li
          v-for="s in 60"
          :key="s - 1"
          class="u-dtp-time-spinner__item"
          :class="{ 'is-selected': s - 1 === second }"
          @click="selectSecond(s - 1)"
        >
          {{ String(s - 1).padStart(2, '0') }}
        </li>
        <li class="u-dtp-time-spinner__pad" />
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'

defineOptions({ name: 'UDateTimePickerTimeSpinner' })

const ITEM_HEIGHT = 32

const props = withDefaults(defineProps<{
  hour: number
  minute: number
  second?: number
  showSeconds?: boolean
}>(), {
  second: 0,
  showSeconds: false
})

const emit = defineEmits<{
  (e: 'update:hour', v: number): void
  (e: 'update:minute', v: number): void
  (e: 'update:second', v: number): void
}>()

const hourCol = ref<HTMLDivElement>()
const minuteCol = ref<HTMLDivElement>()
const secondCol = ref<HTMLDivElement>()

/** 滚动到指定项 */
function scrollTo(col: HTMLDivElement | undefined, index: number, smooth = true) {
  if (!col) return
  const list = col.querySelector('.u-dtp-time-spinner__list')
  if (!list) return
  list.scrollTo({
    top: index * ITEM_HEIGHT,
    behavior: smooth ? 'smooth' : 'auto'
  })
}

/** 根据滚动位置推断当前选中值 */
function getIndexFromScroll(col: HTMLDivElement | undefined): number {
  if (!col) return 0
  const list = col.querySelector('.u-dtp-time-spinner__list')
  if (!list) return 0
  return Math.round(list.scrollTop / ITEM_HEIGHT)
}

let hourScrollTimer: ReturnType<typeof setTimeout> | null = null
let minuteScrollTimer: ReturnType<typeof setTimeout> | null = null
let secondScrollTimer: ReturnType<typeof setTimeout> | null = null

function onHourScroll() {
  if (hourScrollTimer) clearTimeout(hourScrollTimer)
  hourScrollTimer = setTimeout(() => {
    const idx = getIndexFromScroll(hourCol.value)
    if (idx >= 0 && idx < 24 && idx !== props.hour) emit('update:hour', idx)
  }, 80)
}

function onMinuteScroll() {
  if (minuteScrollTimer) clearTimeout(minuteScrollTimer)
  minuteScrollTimer = setTimeout(() => {
    const idx = getIndexFromScroll(minuteCol.value)
    if (idx >= 0 && idx < 60 && idx !== props.minute) emit('update:minute', idx)
  }, 80)
}

function onSecondScroll() {
  if (secondScrollTimer) clearTimeout(secondScrollTimer)
  secondScrollTimer = setTimeout(() => {
    const idx = getIndexFromScroll(secondCol.value)
    if (idx >= 0 && idx < 60 && idx !== props.second) emit('update:second', idx)
  }, 80)
}

function selectHour(v: number) {
  emit('update:hour', v)
  scrollTo(hourCol.value, v)
}

function selectMinute(v: number) {
  emit('update:minute', v)
  scrollTo(minuteCol.value, v)
}

function selectSecond(v: number) {
  emit('update:second', v)
  scrollTo(secondCol.value, v)
}

/** 初始化与 watch 自动对齐 */
function syncScroll(smooth = true) {
  scrollTo(hourCol.value, props.hour, smooth)
  scrollTo(minuteCol.value, props.minute, smooth)
  if (props.showSeconds) scrollTo(secondCol.value, props.second, smooth)
}

onMounted(() => nextTick(() => syncScroll(false)))

watch(() => [props.hour, props.minute, props.second], () => {
  nextTick(() => syncScroll(true))
})

/** 对外暴露，供父组件调用来同步滚动位置 */
defineExpose({ syncScroll })
</script>
