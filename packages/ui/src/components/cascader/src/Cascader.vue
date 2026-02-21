<!--
  Cascader 级联选择器：支持多级树形选项、click/hover 展开、可清除、FormItem 尺寸注入。
  面板结构为横向多列，每展开一级在右侧新增一列。
-->
<template>
  <div
    class="u-cascader"
    :class="{
      'is-disabled': disabled,
      'is-open': panelVisible,
      [`u-cascader--${_size}`]: _size,
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
      :popper-class="'u-cascader__popper'"
      :popper-options="popperOptions"
      @visible-change="onVisibleChange"
    >
      <!-- 触发器 -->
      <div
        ref="triggerRef"
        class="u-cascader__trigger"
        :id="cascaderId"
        role="combobox"
        :aria-expanded="panelVisible"
        :aria-haspopup="'listbox'"
        :aria-label="ariaLabel"
        :aria-disabled="disabled"
      >
        <!-- 已选展示文本 -->
        <span v-if="displayText" class="u-cascader__label">{{ displayText }}</span>
        <span v-else class="u-cascader__placeholder">{{ placeholder ?? '' }}</span>
        <!-- 清除按钮 / 箭头图标 -->
        <span
          v-if="showClearBtn"
          class="u-cascader__clear"
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
          class="u-cascader__suffix"
        />
      </div>
      <!-- 下拉面板：横向多列面板 -->
      <template #content>
        <div class="u-cascader__panel" :style="panelStyle">
          <div
            v-for="(column, colIndex) in columns"
            :key="colIndex"
            class="u-cascader__menu"
            role="listbox"
          >
            <div
              v-for="opt in column"
              :key="String(opt.value)"
              class="u-cascader__option"
              role="option"
              :class="{
                'is-selected': isSelected(colIndex, opt.value),
                'is-disabled': opt.disabled,
                'has-children': opt.children && opt.children.length > 0,
              }"
              :aria-selected="isSelected(colIndex, opt.value)"
              :aria-disabled="opt.disabled || undefined"
              @click="!opt.disabled && handleOptionClick(colIndex, opt)"
              @mouseenter="expandTrigger === 'hover' && !opt.disabled && handleOptionHover(colIndex, opt)"
            >
              <span class="u-cascader__option-label">{{ opt.label }}</span>
              <UIcon
                v-if="opt.children && opt.children.length > 0"
                icon="fa-solid fa-chevron-right"
                size="xs"
                class="u-cascader__option-arrow"
              />
            </div>
          </div>
        </div>
      </template>
    </UTooltip>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import type { CascaderModelValue, CascaderOption, UCascaderEmits, UCascaderProps } from '../types'
import { FORM_ITEM_SIZE_INJECTION_KEY } from '@/components/form'
import { UTooltip } from '@/components/tooltip'
import { UIcon } from '@/components/icon'

defineOptions({
  name: 'UCascader',
})

const props = withDefaults(defineProps<UCascaderProps>(), {
  options: () => [],
  modelValue: () => [],
  size: 'default',
  expandTrigger: 'click',
  closeOnSelect: true,
  separator: ' / ',
  clearable: false,
  changeOnSelect: false,
})

const emits = defineEmits<UCascaderEmits>()

/* ---------- 基础状态 ---------- */
const fallbackId = `u-cascader-${useId()}`
const cascaderId = computed(() => props.id ?? fallbackId)

const formItemSize = inject(FORM_ITEM_SIZE_INJECTION_KEY, null)
const _size = computed(() => formItemSize?.value || props.size)

const tooltipRef = ref<{ hide: () => void; updatePopper: () => void } | null>(null)
const triggerRef = ref<HTMLDivElement | null>(null)
const panelVisible = ref(false)
const triggerWidth = ref(0)
const hovering = ref(false)

/**
 * 用户当前交互路径：每一级选中的 value
 * 注意：这里和 modelValue 独立，只有最终确认（叶子节点 / changeOnSelect）才同步
 */
const activePath = ref<CascaderModelValue>([])

/* ---------- 面板列计算 ---------- */

/** 根据 activePath 展开的多列面板数据 */
const columns = computed((): CascaderOption[][] => {
  const cols: CascaderOption[][] = []
  const root = props.options ?? []
  if (root.length === 0) return cols
  cols.push(root)

  // 按 activePath 逐级展开
  let current: CascaderOption[] = root
  for (const val of activePath.value) {
    const found = current.find(o => o.value === val)
    if (found?.children && found.children.length > 0) {
      cols.push(found.children)
      current = found.children
    } else {
      break
    }
  }
  return cols
})

/* ---------- 显示文本 ---------- */

/** 将选中路径映射为 label 文本（使用 separator 连接） */
const displayText = computed((): string => {
  const path = props.modelValue
  if (!path || path.length === 0) return ''
  const labels: string[] = []
  let current = props.options ?? []
  for (const val of path) {
    const found = current.find(o => o.value === val)
    if (!found) break
    labels.push(found.label)
    current = found.children ?? []
  }
  return labels.join(props.separator)
})

/* ---------- 选中判断 ---------- */

function isSelected(colIndex: number, value: string | number): boolean {
  return activePath.value[colIndex] === value
}

/* ---------- 清除按钮 ---------- */

const showClearBtn = computed((): boolean => {
  if (!props.clearable || props.disabled) return false
  if (!hovering.value) return false
  return (props.modelValue?.length ?? 0) > 0
})

/* ---------- 面板样式 ---------- */

const panelStyle = computed(() => {
  if (triggerWidth.value <= 0) return undefined
  return { minWidth: `${triggerWidth.value}px` }
})

const popperOptions = computed(() => ({
  modifiers: [
    { name: 'offset', options: { offset: [4, 0] } },
  ],
}))

/* ---------- 事件处理 ---------- */

function onVisibleChange(visible: boolean) {
  panelVisible.value = visible
  if (visible) {
    // 面板打开时，将 activePath 同步为当前 modelValue
    activePath.value = [...(props.modelValue ?? [])]
    nextTick(updateTriggerWidth)
    emits('focus', new FocusEvent('focus'))
  } else {
    emits('blur', new FocusEvent('blur'))
  }
}

/** 点击某个选项 */
function handleOptionClick(colIndex: number, opt: CascaderOption) {
  // 截断 activePath 到当前级别，然后写入选中值
  const newPath = activePath.value.slice(0, colIndex)
  newPath.push(opt.value)
  activePath.value = newPath

  const isLeaf = !opt.children || opt.children.length === 0

  if (isLeaf || props.changeOnSelect) {
    // 选中确认：同步到 modelValue
    emits('update:modelValue', [...newPath])
    emits('change', [...newPath])
    // 叶子节点自动关闭面板
    if (isLeaf && props.closeOnSelect) {
      tooltipRef.value?.hide()
    }
  }

  nextTick(() => tooltipRef.value?.updatePopper())
}

/** hover 展开子级（仅展开，不确认选中） */
function handleOptionHover(colIndex: number, opt: CascaderOption) {
  if (!opt.children || opt.children.length === 0) return
  const newPath = activePath.value.slice(0, colIndex)
  newPath.push(opt.value)
  activePath.value = newPath

  // changeOnSelect 模式下 hover 也触发 change
  if (props.changeOnSelect) {
    emits('update:modelValue', [...newPath])
    emits('change', [...newPath])
  }

  nextTick(() => tooltipRef.value?.updatePopper())
}

/** 清除选中值 */
function onClear() {
  activePath.value = []
  emits('update:modelValue', [])
  emits('change', [])
  emits('clear')
  tooltipRef.value?.hide()
}

/* ---------- 触发器宽度同步 ---------- */

function updateTriggerWidth() {
  const w = triggerRef.value?.offsetWidth
  if (w != null) triggerWidth.value = w
}

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
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
