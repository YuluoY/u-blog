<!--
  Select 选择器：自定义弹出下拉，与 Input 同套设计变量与尺寸，支持 FormItem 尺寸注入。
-->
<template>
  <div
    class="u-select"
    :class="{
      'is-disabled': disabled,
      [`u-select--${_size}`]: _size
    }"
  >
    <UTooltip
      ref="tooltipRef"
      trigger="click"
      placement="bottom-start"
      :padding="0"
      :width="0"
      effect="light"
      :disabled="disabled"
      :popper-class="'u-select__popper'"
      :popper-options="popperOptions"
      @visible-change="onVisibleChange"
    >
      <div
        ref="triggerRef"
        class="u-select__trigger"
        :id="selectId"
        role="combobox"
        :aria-expanded="dropdownVisible"
        :aria-haspopup="'listbox'"
        :aria-label="ariaLabel"
        :aria-disabled="disabled"
      >
        <span class="u-select__label">
          {{ displayLabel }}
        </span>
        <UIcon
          icon="fa-solid fa-chevron-down"
          size="xs"
          class="u-select__suffix"
        />
      </div>
      <template #content>
        <div
          class="u-select__dropdown"
          role="listbox"
          :aria-label="ariaLabel"
          :style="dropdownStyle"
        >
          <div
            v-for="opt in normalizedOptions"
            :key="String(opt.value)"
            class="u-select__option"
            role="option"
            :aria-selected="modelValue === opt.value"
            :class="{ 'is-selected': modelValue === opt.value }"
            @click="selectOption(opt)"
          >
            {{ opt.label }}
          </div>
        </div>
      </template>
    </UTooltip>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, ref, useId } from 'vue'
import type { SelectOption, USelectEmits, USelectProps } from '../types'
import { FORM_ITEM_SIZE_INJECTION_KEY } from '@/components/form'
import { UTooltip } from '@/components/tooltip'
import { UIcon } from '@/components/icon'

defineOptions({
  name: 'USelect'
})

const props = withDefaults(defineProps<USelectProps>(), {
  options: () => [],
  size: 'default'
})

const emits = defineEmits<USelectEmits>()

const fallbackId = `u-select-${useId()}`
const selectId = computed(() => props.id ?? fallbackId)

const formItemSize = inject(FORM_ITEM_SIZE_INJECTION_KEY, null)
const _size = computed(() => formItemSize?.value || props.size)

const tooltipRef = ref<{ hide: () => void } | null>(null)
const triggerRef = ref<HTMLDivElement | null>(null)
const dropdownVisible = ref(false)
const triggerWidth = ref(0)

const dropdownStyle = computed(() =>
  triggerWidth.value > 0 ? { minWidth: `${triggerWidth.value}px` } : undefined
)

const popperOptions = computed(() => ({
  modifiers: [
    {
      name: 'offset',
      options: { offset: [4, 0] }
    }
  ]
}))

/** 当前展示文案：选中项的 label 或 placeholder */
const displayLabel = computed(() => {
  const v = props.modelValue
  if (v === undefined || v === '' || v === null) return props.placeholder ?? ''
  const opt = normalizedOptions.value.find(o => o.value === v)
  return opt ? opt.label : String(v)
})

/** 统一为 { value, label }[] */
const normalizedOptions = computed((): SelectOption[] => {
  const list = props.options ?? []
  if (list.length === 0) return []
  const first = list[0]
  if (typeof first === 'object' && first !== null && 'value' in first && 'label' in first) {
    return list as SelectOption[]
  }
  return (list as (string | number)[]).map((v) => ({ value: v, label: String(v) }))
})

function onVisibleChange(visible: boolean) {
  dropdownVisible.value = visible
  if (visible) {
    nextTick(() => {
      triggerWidth.value = triggerRef.value?.offsetWidth ?? 0
    })
    emits('focus', new FocusEvent('focus'))
  } else {
    emits('blur', new FocusEvent('blur'))
  }
}

function selectOption(opt: SelectOption) {
  emits('update:modelValue', opt.value)
  emits('change', opt.value)
  tooltipRef.value?.hide()
}
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
