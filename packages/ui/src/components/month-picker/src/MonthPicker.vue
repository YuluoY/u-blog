<!--
  MonthPicker 年月选择器：上一月/下一月按钮 + 年份下拉 + 月份下拉，与 Select/Button 风格一致。
-->
<template>
  <div class="u-month-picker" :class="{ [`u-month-picker--${size}`]: size }">
    <UButton
      type="primary"
      plain
      circle
      :size="size"
      class="u-month-picker__nav"
      :aria-label="prevMonthAriaLabel"
      @click="$emit('prev')"
    >
      <UIcon icon="fa-solid fa-chevron-left" size="xs" />
    </UButton>
    <div class="u-month-picker__selects">
      <USelect
        :model-value="year"
        :options="yearOptions.map((y) => ({ value: y, label: String(y) }))"
        :size="size"
        :aria-label="ariaYearLabel"
        class="u-month-picker__select"
        @update:model-value="$emit('update:year', Number($event))"
      />
      <span class="u-month-picker__sep">{{ separator }}</span>
      <USelect
        :model-value="month"
        :options="monthOptionsNormalized"
        :size="size"
        :aria-label="ariaMonthLabel"
        class="u-month-picker__select"
        @update:model-value="$emit('update:month', Number($event))"
      />
    </div>
    <UButton
      type="primary"
      plain
      circle
      :size="size"
      :disabled="disableNext"
      class="u-month-picker__nav"
      :aria-label="nextMonthAriaLabel"
      @click="$emit('next')"
    >
      <UIcon icon="fa-solid fa-chevron-right" size="xs" />
    </UButton>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { UButton } from '@/components/button'
import { USelect } from '@/components/select'
import { UIcon } from '@/components/icon'
import type { SelectOption } from '@/components/select'
import type { UMonthPickerEmits, UMonthPickerProps } from '../types'

defineOptions({
  name: 'UMonthPicker'
})

const props = withDefaults(defineProps<UMonthPickerProps>(), {
  monthOptions: undefined,
  disableNext: false,
  size: 'default',
  separator: ' / ',
  ariaYearLabel: 'Year',
  ariaMonthLabel: 'Month',
  prevMonthAriaLabel: 'Previous month',
  nextMonthAriaLabel: 'Next month'
})

defineEmits<UMonthPickerEmits>()

const monthOptionsNormalized = computed((): SelectOption[] => {
  if (props.monthOptions?.length) return props.monthOptions
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: String(i + 1)
  }))
})
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
