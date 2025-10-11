<template>
  <div
    ref="sliderRef"
    class="u-slider"
    @mousedown="onTrackMousedown"
  >
    <div class="u-slider__track" />
    <div
      class="u-slider__progress"
      :style="{ width: `${value}%` }"
    />
    <div
      class="u-slider__thumb-wrapper"
      :style="{ left: `${value}%` }"
      @mousedown="onMousedown"
      @touchstart="onMousedown"
    >
      <div class="u-slider__thumb">
        <u-tooltip
          ref="tooltipRef"
          :class="tooltipClass"
          :placement="placement"
          :visible="tooltipVisible"
          v-bind="_popperOptions"
          :content="String(Math.round(value))"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UTooltip } from '@/components'
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import type { USliderEmits, USliderProps } from '../types'

defineOptions({
  name: 'USlider',
})
const props = withDefaults(defineProps<USliderProps>(), {
  modelValue: 0,
  tooltipClass: '',
  placement: 'top',
})
const emits = defineEmits<USliderEmits>()
const value = ref<number>(props.modelValue)
const tooltipVisible = ref(false)
const isPressed = ref(false)
const _popperOptions = computed(() => ({ width: 0, ...props.popperOptions }))
const sliderRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<InstanceType<typeof UTooltip> | null>(null)

function onMousedown(e: MouseEvent | TouchEvent)
{
  isPressed.value = true
  tooltipRef.value?.onOpen()
  updateValue(e) // 初始化时更新 value
}

function onMouseup()
{
  isPressed.value = false
  tooltipRef.value?.onClose()
}

function onMousemove(e: MouseEvent | TouchEvent)
{
  if (!isPressed.value) return
  updateValue(e) // 更新 value
}

function updateValue(e: MouseEvent | TouchEvent)
{
  if (!sliderRef.value) return
  const rect = sliderRef.value.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const newValue = ((clientX - rect.left) / rect.width) * 100
  value.value = Math.min(100, Math.max(0, newValue)) // 限制在 0 到 100 之间
  tooltipRef.value?.updatePopper()
  tooltipRef.value?.onOpen()
  emits('update:modelValue', value.value)
  emits('change', value.value)
}

function onTrackMousedown(e: MouseEvent)
{
  onMousedown(e) // 允许点击轨道时也能控制滑块
}

onMounted(() =>
{
  window.addEventListener('mouseup', onMouseup)
  window.addEventListener('mousemove', onMousemove)
  window.addEventListener('touchend', onMouseup)
  window.addEventListener('touchmove', onMousemove)
})

onBeforeUnmount(() =>
{
  window.removeEventListener('mouseup', onMouseup)
  window.removeEventListener('mousemove', onMousemove)
  window.removeEventListener('touchend', onMouseup)
  window.removeEventListener('touchmove', onMousemove)
})
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
