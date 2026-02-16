<!--
  UInputNumber 数字输入框
  支持 min/max/step、增减按钮、键盘与无障碍（aria-label 国际化）。
-->
<template>
  <div class="u-input-number">
    <button
      v-if="controls"
      type="button"
      class="u-input-number__decrease"
      :disabled="disabled || isMin"
      :aria-label="t('inputNumber.decreaseAria')"
      @click="stepDown"
    >
      <u-icon icon="fa-solid fa-minus" />
    </button>
    <input
      ref="inputRef"
      type="number"
      class="u-input-number__inner"
      :value="displayValue"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      :placeholder="placeholder"
      :aria-label="ariaLabel"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    />
    <button
      v-if="controls"
      type="button"
      class="u-input-number__increase"
      :disabled="disabled || isMax"
      :aria-label="t('inputNumber.increaseAria')"
      @click="stepUp"
    >
      <u-icon icon="fa-solid fa-plus" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { UInputNumberEmits, UInputNumberProps } from '../types'
import { useLocale } from '@/components/config-provider'

defineOptions({
  name: 'UInputNumber'
})

const { t } = useLocale()

const props = withDefaults(defineProps<UInputNumberProps>(), {
  modelValue: undefined,
  min: -Infinity,
  max: Infinity,
  step: 1,
  disabled: false,
  controls: true
})

const emits = defineEmits<UInputNumberEmits>()

const inputRef = ref<HTMLInputElement | null>(null)
const innerValue = ref<number | undefined>(props.modelValue)

watch(() => props.modelValue, (v) => { innerValue.value = v })

const displayValue = computed(() => innerValue.value)
const isMin = computed(() => props.min !== -Infinity && (innerValue.value ?? props.min) <= props.min)
const isMax = computed(() => props.max !== Infinity && (innerValue.value ?? props.max) >= props.max)

/** 将数值限制在 [min, max] 范围内 */
function clamp(v: number): number {
  let n = v
  if (props.min !== -Infinity) n = Math.max(props.min, n)
  if (props.max !== Infinity) n = Math.min(props.max, n)
  return n
}

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  if (raw === '') {
    innerValue.value = undefined
    emits('update:modelValue', undefined)
    return
  }
  const num = Number(raw)
  if (Number.isNaN(num)) return
  const clamped = clamp(num)
  innerValue.value = clamped
  emits('update:modelValue', clamped)
  emits('change', clamped)
}

/** 步进 +1（受 min/max 约束） */
function stepUp() {
  if (props.disabled || isMax.value) return
  const base = innerValue.value ?? props.min
  const next = clamp(base + props.step)
  innerValue.value = next
  emits('update:modelValue', next)
  emits('change', next)
}

/** 步进 -1（受 min/max 约束） */
function stepDown() {
  if (props.disabled || isMin.value) return
  const base = innerValue.value ?? props.max
  const next = clamp(base - props.step)
  innerValue.value = next
  emits('update:modelValue', next)
  emits('change', next)
}

function onFocus(e: FocusEvent) {
  emits('focus', e)
}

function onBlur(e: FocusEvent) {
  emits('blur', e)
}
</script>

<style lang="scss">
@forward '../styles/input-number.scss';
</style>
