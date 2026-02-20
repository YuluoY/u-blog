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
import { computed, inject, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import type { SelectOption, USelectEmits, USelectProps } from '../types'
import { FORM_ITEM_SIZE_INJECTION_KEY } from '@/components/form'
import { UTooltip } from '@/components/tooltip'
import { UIcon } from '@/components/icon'

defineOptions({
  name: 'USelect'
})

const props = withDefaults(defineProps<USelectProps>(), {
  options: () => [],
  size: 'default',
  fitInputWidth: true
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

/** 参考 Element Plus select-dropdown：fitInputWidth 时用 width 严格对齐触发器，否则用 minWidth 允许下拉被内容撑开 */
const dropdownStyle = computed(() => {
  if (triggerWidth.value <= 0) return undefined
  const key = props.fitInputWidth ? 'width' : 'minWidth'
  return { [key]: `${triggerWidth.value}px` }
})

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

function updateTriggerWidth() {
  const w = triggerRef.value?.offsetWidth
  if (w != null) triggerWidth.value = w
}

function onVisibleChange(visible: boolean) {
  dropdownVisible.value = visible
  if (visible) {
    nextTick(updateTriggerWidth)
    emits('focus', new FocusEvent('focus'))
  } else {
    emits('blur', new FocusEvent('blur'))
  }
}

/** 参考 Element Plus：触发器尺寸变化时同步下拉宽度 */
let resizeObserver: ResizeObserver | null = null
watch(triggerRef, (el) => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (el) {
    resizeObserver = new ResizeObserver(updateTriggerWidth)
    resizeObserver.observe(el)
    updateTriggerWidth()
  }
}, { immediate: true })
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

function selectOption(opt: SelectOption) {
  emits('update:modelValue', opt.value)
  emits('change', opt.value)
  tooltipRef.value?.hide()
}
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
