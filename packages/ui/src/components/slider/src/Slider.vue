<!--
  Slider 滑块：水平/垂直、min/max/step、拖拽与键盘、可选刻度与输入框，Tooltip 显示当前值。
-->
<template>
  <div
    ref="sliderRef"
    class="u-slider"
    :class="{
      'is-disabled': disabled,
      'is-vertical': vertical
    }"
    role="slider"
    :aria-valuenow="Math.round(internalValue)"
    :aria-valuemin="min"
    :aria-valuemax="max"
    :aria-disabled="disabled"
    :aria-label="ariaLabel || t('slider.defaultLabel', { min: min, max: max })"
    :tabindex="disabled ? -1 : 0"
    @mousedown="onTrackMousedown"
    @keydown="onKeydown"
  >
    <div class="u-slider__track" />
    <div
      v-if="showStops && step > 0"
      class="u-slider__stops"
    >
      <div
        v-for="stop in stops"
        :key="stop"
        class="u-slider__stop"
        :style="{ [vertical ? 'bottom' : 'left']: `${((stop - min) / (max - min)) * 100}%` }"
      />
    </div>
    <div
      class="u-slider__progress"
      :style="progressStyle"
    />
    <div
      class="u-slider__thumb-wrapper"
      :style="thumbStyle"
      @mousedown.stop="onMousedown"
      @touchstart.stop="onMousedown"
    >
      <div class="u-slider__thumb">
        <u-tooltip
          v-if="showTooltip"
          ref="tooltipRef"
          :class="tooltipClass"
          :placement="placement"
          :visible="tooltipVisible"
          v-bind="_popperOptions"
          :content="formatValue(internalValue)"
        />
      </div>
    </div>
    <div
      v-if="showInput && !vertical"
      class="u-slider__input-wrapper"
    >
      <input
        v-model.number="inputValue"
        type="number"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        class="u-slider__input"
        @change="onInputChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { UTooltip } from '@/components/tooltip'
import { useLocale } from '@/components/config-provider'
import { computed, ref, onMounted, onBeforeUnmount, watch, type CSSProperties } from 'vue'
import type { USliderEmits, USliderProps } from '../types'

defineOptions({
  name: 'USlider',
})

const { t } = useLocale()
const props = withDefaults(defineProps<USliderProps>(), {
  modelValue: 0,
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
  vertical: false,
  showInput: false,
  showStops: false,
  showTooltip: true,
  tooltipClass: '',
  placement: 'top',
  height: '200px',
})

const emits = defineEmits<USliderEmits>()

const internalValue = ref<number>(clampValue(props.modelValue))
const inputValue = ref<number>(Math.round(internalValue.value))
const tooltipVisible = ref(false)
const isPressed = ref(false)
const sliderRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<InstanceType<typeof UTooltip> | null>(null)

const _popperOptions = computed(() => ({ width: 0, ...props.popperOptions }))

const progressStyle = computed<CSSProperties>(() => {
  const percent = valueToPercent(internalValue.value)
  if (props.vertical) {
    return { height: `${percent}%` }
  }
  return { width: `${percent}%` }
})

const thumbStyle = computed<CSSProperties>(() => {
  const percent = valueToPercent(internalValue.value)
  if (props.vertical) {
    return { bottom: `${percent}%` }
  }
  return { left: `${percent}%` }
})

// 刻度点位置（按 step 在 min～max 之间）
const stops = computed(() => {
  if (!props.showStops || props.step <= 0) return []
  const result: number[] = []
  for (let i = props.min + props.step; i < props.max; i += props.step) {
    result.push(i)
  }
  return result
})

watch(() => props.modelValue, (newVal) => {
  internalValue.value = clampValue(newVal)
  inputValue.value = Math.round(internalValue.value)
})

/** 将值限制在 [min, max] 并按 step 对齐 */
function clampValue(val: number): number {
  let clamped = Math.max(props.min, Math.min(props.max, val))
  if (props.step > 0) {
    const steps = Math.round((clamped - props.min) / props.step)
    clamped = props.min + steps * props.step
  }
  return clamped
}

/** 数值转 0～100 百分比 */
function valueToPercent(val: number): number {
  return ((val - props.min) / (props.max - props.min)) * 100
}

/** 百分比转数值 */
function percentToValue(percent: number): number {
  return props.min + (percent / 100) * (props.max - props.min)
}

/** Tooltip 显示文案：优先 formatTooltip，否则四舍五入整数 */
function formatValue(val: number): string {
  if (props.formatTooltip) {
    return String(props.formatTooltip(val))
  }
  return String(Math.round(val))
}

function onMousedown(e: MouseEvent | TouchEvent) {
  if (props.disabled) return
  isPressed.value = true
  tooltipVisible.value = true
  tooltipRef.value?.onOpen()
  updateValue(e)
}

function onMouseup() {
  if (!isPressed.value) return
  isPressed.value = false
  tooltipVisible.value = false
  tooltipRef.value?.onClose()
  emits('change', internalValue.value)
}

function onMousemove(e: MouseEvent | TouchEvent) {
  if (!isPressed.value || props.disabled) return
  updateValue(e)
}

/**
 * 根据鼠标/触摸位置更新滑块值（水平为 left/width，垂直为 bottom/height）
 */
function updateValue(e: MouseEvent | TouchEvent) {
  if (!sliderRef.value || props.disabled) return
  const rect = sliderRef.value.getBoundingClientRect()
  
  let percent: number
  if (props.vertical) {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    percent = ((rect.bottom - clientY) / rect.height) * 100
  } else {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    percent = ((clientX - rect.left) / rect.width) * 100
  }
  
  const rawValue = percentToValue(Math.min(100, Math.max(0, percent)))
  const newValue = clampValue(rawValue)
  
  if (newValue !== internalValue.value) {
    internalValue.value = newValue
    inputValue.value = Math.round(newValue)
    emits('update:modelValue', newValue)
    emits('input', newValue)
  }
  
  tooltipRef.value?.updatePopper()
}

function onTrackMousedown(e: MouseEvent) {
  if (props.disabled) return
  const target = e.target as HTMLElement
  if (target.classList.contains('u-slider__thumb')) return
  onMousedown(e)
}

function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  
  let delta = 0
  const stepSize = props.step || 1
  
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      delta = stepSize
      break
    case 'ArrowLeft':
    case 'ArrowDown':
      delta = -stepSize
      break
    case 'Home':
      internalValue.value = props.min
      emits('update:modelValue', props.min)
      emits('change', props.min)
      return
    case 'End':
      internalValue.value = props.max
      emits('update:modelValue', props.max)
      emits('change', props.max)
      return
    default:
      return
  }
  
  e.preventDefault()
  const newValue = clampValue(internalValue.value + delta)
  if (newValue !== internalValue.value) {
    internalValue.value = newValue
    inputValue.value = Math.round(newValue)
    emits('update:modelValue', newValue)
    emits('input', newValue)
  }
}

function onInputChange() {
  const newValue = clampValue(inputValue.value)
  internalValue.value = newValue
  inputValue.value = Math.round(newValue)
  emits('update:modelValue', newValue)
  emits('change', newValue)
}

onMounted(() => {
  if (typeof window === 'undefined') return
  window.addEventListener('mouseup', onMouseup)
  window.addEventListener('mousemove', onMousemove)
  window.addEventListener('touchend', onMouseup)
  window.addEventListener('touchmove', onMousemove)
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('mouseup', onMouseup)
  window.removeEventListener('mousemove', onMousemove)
  window.removeEventListener('touchend', onMouseup)
  window.removeEventListener('touchmove', onMousemove)
})
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
