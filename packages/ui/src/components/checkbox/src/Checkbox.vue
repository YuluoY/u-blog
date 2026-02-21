<!--
  Checkbox 复选框：支持 v-model、indeterminate、disabled，使用主题变量，适配深色模式。
-->
<template>
  <label
    class="u-checkbox"
    :class="{
      'is-checked': _checked,
      'is-indeterminate': indeterminate,
      'is-disabled': disabled,
      'is-bordered': border,
      [`u-checkbox--${_size}`]: _size
    }"
    :aria-disabled="disabled ? 'true' : undefined"
  >
    <input
      :id="inputId"
      type="checkbox"
      class="u-checkbox__input"
      :name="name"
      :checked="_value"
      :disabled="disabled"
      :aria-label="ariaLabel"
      :indeterminate="indeterminate"
      @change="onChange"
    />
    <span class="u-checkbox__inner" aria-hidden="true">
      <u-icon v-if="_checked && !indeterminate" class="u-checkbox__icon" :icon="['fas', 'check']" />
      <span v-else-if="indeterminate" class="u-checkbox__indeterminate" />
    </span>
    <span v-if="$slots.default" class="u-checkbox__label">
      <slot />
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import type { UCheckboxEmits, UCheckboxProps } from '../types'
import { UIcon } from '@/components/icon'

defineOptions({
  name: 'UCheckbox'
})

const props = withDefaults(defineProps<UCheckboxProps>(), {
  modelValue: false,
  disabled: false,
  indeterminate: false,
  size: 'default',
  border: false
})

const emit = defineEmits<UCheckboxEmits>()

const fallbackId = `u-checkbox-${useId()}`
const inputId = computed(() => props.id ?? fallbackId)

const _value = computed(() => !!props.modelValue)
const _checked = computed(() => _value.value)
const _size = computed(() => props.size)

function onChange(evt: Event) {
  const checked = (evt.target as HTMLInputElement).checked
  emit('update:modelValue', checked)
  emit('change', checked)
}
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
