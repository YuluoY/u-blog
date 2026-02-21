<!--
  Select 选择器：自定义弹出下拉，支持单选/多选，与 Input 同套设计变量与尺寸，支持 FormItem 尺寸注入。
-->
<template>
  <div
    class="u-select"
    :class="{
      'is-disabled': disabled,
      'is-multiple': isMultiple,
      'is-open': dropdownVisible,
      [`u-select--${_size}`]: _size
    }"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
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
      <!-- 单选触发器 -->
      <div
        v-if="!isMultiple"
        ref="triggerRef"
        class="u-select__trigger"
        :id="selectId"
        role="combobox"
        :aria-expanded="dropdownVisible"
        :aria-haspopup="'listbox'"
        :aria-label="ariaLabel"
        :aria-disabled="disabled"
      >
        <span v-if="hasValue" class="u-select__label">
          {{ displayLabel }}
        </span>
        <span v-else class="u-select__placeholder">
          {{ placeholder ?? '' }}
        </span>
        <!-- 清除按钮 / 箭头图标 -->
        <span
          v-if="showClearBtn"
          class="u-select__clear"
          role="button"
          aria-label="清除"
          @click.stop="onClear"
        >
          <UIcon icon="fa-solid fa-circle-xmark" size="xs" />
        </span>
        <UIcon
          v-else
          icon="fa-solid fa-chevron-down"
          size="xs"
          class="u-select__suffix"
        />
      </div>
      <!-- 多选触发器：tag chips -->
      <div
        v-else
        ref="triggerRef"
        class="u-select__trigger u-select__trigger--multiple"
        :id="selectId"
        role="combobox"
        :aria-expanded="dropdownVisible"
        :aria-haspopup="'listbox'"
        :aria-label="ariaLabel"
        :aria-disabled="disabled"
      >
        <div v-if="selectedArray.length === 0" class="u-select__placeholder">
          {{ placeholder ?? '' }}
        </div>
        <div v-else class="u-select__tags">
          <UTag
            v-for="opt in selectedOptions"
            :key="String(opt.value)"
            size="small"
            :closable="tagClosable !== false && !disabled"
            effect="light"
            class="u-select__tag"
            @close.stop="removeTag(opt.value)"
          >
            {{ opt.label }}
          </UTag>
        </div>
        <!-- 清除按钮 / 箭头图标 -->
        <span
          v-if="showClearBtn"
          class="u-select__clear"
          role="button"
          aria-label="清除"
          @click.stop="onClear"
        >
          <UIcon icon="fa-solid fa-circle-xmark" size="xs" />
        </span>
        <UIcon
          v-else
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
          :aria-multiselectable="isMultiple || undefined"
          :style="dropdownStyle"
        >
          <div
            v-for="opt in normalizedOptions"
            :key="String(opt.value)"
            class="u-select__option"
            role="option"
            :aria-selected="isOptionSelected(opt.value)"
            :class="{
              'is-selected': isOptionSelected(opt.value),
              'is-multiple': isMultiple
            }"
            @click="selectOption(opt)"
          >
            <!-- 多选时显示勾选图标 -->
            <span v-if="isMultiple" class="u-select__option-check">
              <UIcon
                v-if="isOptionSelected(opt.value)"
                icon="fa-solid fa-check"
                size="xs"
              />
            </span>
            <span class="u-select__option-label">{{ opt.label }}</span>
          </div>
        </div>
      </template>
    </UTooltip>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import type { SelectModelValue, SelectOption, USelectEmits, USelectProps } from '../types'
import { FORM_ITEM_SIZE_INJECTION_KEY } from '@/components/form'
import { UTooltip } from '@/components/tooltip'
import { UIcon } from '@/components/icon'
import { UTag } from '@/components/tag'

defineOptions({
  name: 'USelect'
})

const props = withDefaults(defineProps<USelectProps>(), {
  options: () => [],
  size: 'default',
  fitInputWidth: true,
  multiple: false,
  maxTagCount: 0,
  tagClosable: true,
  clearable: false
})

const emits = defineEmits<USelectEmits>()

const fallbackId = `u-select-${useId()}`
const selectId = computed(() => props.id ?? fallbackId)

const formItemSize = inject(FORM_ITEM_SIZE_INJECTION_KEY, null)
const _size = computed(() => formItemSize?.value || props.size)

const isMultiple = computed(() => props.multiple)

const tooltipRef = ref<{ hide: () => void } | null>(null)
const triggerRef = ref<HTMLDivElement | null>(null)
const dropdownVisible = ref(false)
const triggerWidth = ref(0)
const hovering = ref(false)

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

/** 多选模式下，modelValue 归一化为数组 */
const selectedArray = computed((): (string | number)[] => {
  if (!isMultiple.value) return []
  const v = props.modelValue
  if (Array.isArray(v)) return v
  if (v === undefined || v === null || v === '') return []
  return [v]
})

/** 多选模式下，已选项的 { value, label } 列表 */
const selectedOptions = computed((): SelectOption[] => {
  return selectedArray.value
    .map(v => normalizedOptions.value.find(o => o.value === v))
    .filter((o): o is SelectOption => !!o)
})

/** 多选模式下，可见的 tag 列表（受 maxTagCount 控制） */
const visibleTags = computed((): SelectOption[] => {
  if (props.maxTagCount > 0 && selectedOptions.value.length > props.maxTagCount) {
    return selectedOptions.value.slice(0, props.maxTagCount)
  }
  return selectedOptions.value
})

/** 多选折叠数量 */
const collapsedCount = computed((): number => {
  if (props.maxTagCount <= 0) return 0
  return Math.max(0, selectedOptions.value.length - props.maxTagCount)
})

/** 当前展示文案（单选）：选中项的 label */
const displayLabel = computed(() => {
  if (isMultiple.value) return ''
  const v = props.modelValue
  if (v === undefined || v === '' || v === null || Array.isArray(v)) return ''
  const opt = normalizedOptions.value.find(o => o.value === v)
  return opt ? opt.label : String(v)
})

/** 单选是否有选中值 */
const hasValue = computed(() => {
  const v = props.modelValue
  return v !== undefined && v !== '' && v !== null && !Array.isArray(v)
})

/** 是否显示清除按钮 */
const showClearBtn = computed(() => {
  if (!props.clearable || props.disabled) return false
  if (!hovering.value) return false
  return isMultiple.value
    ? selectedArray.value.length > 0
    : hasValue.value
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

/** 判断某个选项是否被选中 */
function isOptionSelected(value: string | number): boolean {
  if (isMultiple.value) {
    return selectedArray.value.includes(value)
  }
  return props.modelValue === value
}

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

/** 清除选中值 */
function onClear() {
  if (isMultiple.value) {
    emits('update:modelValue', [])
    emits('change', [])
  } else {
    emits('update:modelValue', '' as SelectModelValue)
    emits('change', '' as SelectModelValue)
  }
  emits('clear')
  tooltipRef.value?.hide()
}

/** 选中/取消选项 */
function selectOption(opt: SelectOption) {
  if (isMultiple.value) {
    const arr = [...selectedArray.value]
    const idx = arr.indexOf(opt.value)
    if (idx > -1) {
      arr.splice(idx, 1)
    } else {
      arr.push(opt.value)
    }
    emits('update:modelValue', arr)
    emits('change', arr)
    // 多选模式不关闭面板
    nextTick(updateTriggerWidth)
  } else {
    emits('update:modelValue', opt.value as SelectModelValue)
    emits('change', opt.value as SelectModelValue)
    tooltipRef.value?.hide()
  }
}

/** 多选模式下移除某个 tag */
function removeTag(value: string | number) {
  if (!isMultiple.value) return
  const arr = selectedArray.value.filter(v => v !== value)
  emits('update:modelValue', arr)
  emits('change', arr)
  emits('remove-tag', value)
  nextTick(updateTriggerWidth)
}
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
