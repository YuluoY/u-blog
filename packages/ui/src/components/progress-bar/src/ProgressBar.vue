<!--
  ProgressBar 请求加载进度条：固定在窗口顶部/底部，支持主题色、手动/自动进度、光效动画。
  适用于页面路由切换、API 请求等场景，暴露 start/done/set/inc/fail 方法。
-->
<template>
  <Teleport to="body">
    <Transition name="u-progress-bar-fade">
      <div
        v-show="visible"
        class="u-progress-bar"
        :class="[
          `u-progress-bar--${position}`,
          { 'u-progress-bar--fixed': fixed }
        ]"
        role="progressbar"
        :aria-valuenow="Math.round(currentProgress)"
        aria-valuemin="0"
        aria-valuemax="100"
        :style="containerStyle"
      >
        <!-- 进度条主体 -->
        <div
          class="u-progress-bar__bar"
          :class="[
            `u-progress-bar__bar--${currentType}`,
            { 'u-progress-bar__bar--indeterminate': indeterminate && visible }
          ]"
          :style="barStyle"
        />
        <!-- 光效 peg -->
        <div
          v-if="showGlow && !indeterminate"
          class="u-progress-bar__peg"
          :class="`u-progress-bar__peg--${currentType}`"
          :style="pegStyle"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch, type CSSProperties } from 'vue'
import type { UProgressBarProps, UProgressBarEmits, UProgressBarExposes } from '../types'
import { pxToRem } from '@u-blog/utils'

defineOptions({
  name: 'UProgressBar'
})

const props = withDefaults(defineProps<UProgressBarProps>(), {
  modelValue: 0,
  type: 'primary',
  height: 3,
  position: 'top',
  fixed: true,
  zIndex: 9999,
  showGlow: true,
  backgroundColor: 'transparent',
  borderRadius: 0,
  indeterminate: false,
})
const emits = defineEmits<UProgressBarEmits>()

/* ---- 内部状态 ---- */
const currentProgress = ref(props.modelValue)
const visible = ref(false)
const isLoading = ref(false)
const currentType = ref(props.type)
let tickTimer: ReturnType<typeof setInterval> | null = null

/* ---- 同步外部 modelValue ---- */
watch(() => props.modelValue, (val) => {
  currentProgress.value = val
  if (val > 0 && val < 100) {
    visible.value = true
    isLoading.value = true
  }
})

watch(() => props.type, (val) => {
  currentType.value = val
})

/* ---- 样式计算 ---- */
const containerStyle = computed<CSSProperties>(() => ({
  height: pxToRem(props.height),
  zIndex: props.zIndex,
  backgroundColor: props.backgroundColor,
  borderRadius: props.borderRadius ? pxToRem(props.borderRadius) : undefined,
}))

const barStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {
    width: props.indeterminate ? '100%' : `${currentProgress.value}%`,
    borderRadius: props.borderRadius ? pxToRem(props.borderRadius) : undefined,
  }
  if (props.color) {
    style.backgroundColor = props.color
  }
  return style
})

const pegStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {}
  if (props.color) {
    style.boxShadow = `0 0 10px ${props.color}, 0 0 5px ${props.color}`
  }
  return style
})

/* ---- 核心方法 ---- */

/** 清除自增定时器 */
function clearTick() {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

/** 开始加载：进度从一小段缓慢增长 */
function start() {
  clearTick()
  currentType.value = props.type
  currentProgress.value = 0
  visible.value = true
  isLoading.value = true

  // 模拟加载过程：速率随进度递减
  tickTimer = setInterval(() => {
    inc()
  }, 300)
}

/** 完成加载：进度快速到 100 并渐隐 */
function done() {
  clearTick()
  currentProgress.value = 100
  emits('update:modelValue', 100)

  // 短暂展示 100% 后隐藏
  setTimeout(() => {
    visible.value = false
    isLoading.value = false
    emits('done')
    // 隐藏后重置进度
    setTimeout(() => {
      currentProgress.value = 0
      emits('update:modelValue', 0)
    }, 300)
  }, 400)
}

/** 设置指定进度 */
function set(value: number) {
  const clamped = Math.max(0, Math.min(100, value))
  currentProgress.value = clamped
  emits('update:modelValue', clamped)
  if (clamped > 0 && clamped < 100) {
    visible.value = true
    isLoading.value = true
  } else if (clamped >= 100) {
    done()
  }
}

/** 递增进度（增量随当前值递减，模拟真实加载节奏） */
function inc(amount?: number) {
  const cur = currentProgress.value
  if (cur >= 99) return

  let step = amount
  if (!step) {
    if (cur < 20) step = 8 + Math.random() * 5
    else if (cur < 50) step = 3 + Math.random() * 4
    else if (cur < 80) step = 1 + Math.random() * 2
    else if (cur < 95) step = 0.3 + Math.random() * 0.8
    else step = 0.1
  }

  const next = Math.min(cur + step, 99.4)
  currentProgress.value = next
  emits('update:modelValue', next)
}

/** 失败：显示红色并渐隐 */
function fail() {
  clearTick()
  currentType.value = 'danger'
  currentProgress.value = 100
  emits('update:modelValue', 100)

  setTimeout(() => {
    visible.value = false
    isLoading.value = false
    setTimeout(() => {
      currentProgress.value = 0
      currentType.value = props.type
      emits('update:modelValue', 0)
    }, 300)
  }, 800)
}

onBeforeUnmount(() => {
  clearTick()
})

defineExpose<UProgressBarExposes>({
  start,
  done,
  set,
  inc,
  fail,
  get isLoading() {
    return isLoading.value
  }
})
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
