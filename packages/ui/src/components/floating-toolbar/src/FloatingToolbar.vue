<!--
  UFloatingToolbar — 浮动操作栏（组合层）
  基于 UToolbar 原子组件，附加浮动定位 + 选区检测能力。
  选中文本后鼠标松开时在选区上方弹出。
-->
<template>
  <Teleport to="body">
    <Transition name="u-floating-toolbar-fade">
      <div
        v-if="visible && selectedText"
        ref="toolbarRef"
        class="u-floating-toolbar"
        :class="{ 'u-floating-toolbar--flipped': flipped }"
        :style="positionStyle"
        @mousedown.prevent
      >
        <!-- 内部使用 UToolbar 渲染工具条内容 -->
        <Toolbar
          :actions="actions"
          :loading="props.loading"
          :loading-text="props.loadingText"
          :size="props.size"
          @action="handleToolbarAction"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { UFloatingToolbarProps, UFloatingToolbarEmits } from '../types'
import {
  CFloatingToolbarHideDelay,
  CFloatingToolbarMinLength,
  CFloatingToolbarDefaultSize,
} from '../consts'
import Toolbar from '../../toolbar/src/Toolbar.vue'

defineOptions({ name: 'UFloatingToolbar' })

const props = withDefaults(defineProps<UFloatingToolbarProps>(), {
  actions: () => [],
  container: null,
  loading: false,
  loadingText: '',
  minLength: CFloatingToolbarMinLength,
  hideDelay: CFloatingToolbarHideDelay,
  size: CFloatingToolbarDefaultSize,
})

const emit = defineEmits<UFloatingToolbarEmits>()

/* ─── 响应式状态 ─── */
const visible = ref(false)
const selectedText = ref('')
const pos = ref({ top: 0, left: 0 })
const flipped = ref(false)
const toolbarRef = ref<HTMLElement | null>(null)
let hideTimer: ReturnType<typeof setTimeout> | null = null

/** 动态定位样式 */
const positionStyle = computed(() => ({
  top: `${pos.value.top}px`,
  left: `${pos.value.left}px`,
}))

/* ─── 选区检测逻辑 ─── */

/**
 * 鼠标松开时检查选区
 * 仅当选区落在 container 内、文本长度 ≥ minLength 时弹出
 */
function handleMouseUp() {
  if (props.loading) return
  checkAndShowToolbar()
}

/** 调整工具条位置，防止超出视口（上下左右） */
function adjustPosition()
{
  const el = toolbarRef.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  const vw = window.innerWidth
  const MARGIN = 8

  // 左侧超出
  if (rect.left < MARGIN)
    pos.value.left += MARGIN - rect.left

  // 右侧超出
  if (rect.right > vw - MARGIN)
    pos.value.left -= rect.right - vw + MARGIN

  // 顶部超出 → 翻转到选区下方
  if (rect.top < MARGIN)
  {
    pos.value.top += rect.height + 24
    flipped.value = true
  }

  // 底部超出（翻转后可能溢出底部）
  if (rect.bottom > window.innerHeight - MARGIN)
  {
    pos.value.top -= rect.bottom - window.innerHeight + MARGIN
  }
}

/**
 * 键盘松开时检查选区（Shift+方向键 / Ctrl+A 等键盘选中场景）
 */
function handleKeyUp(e: KeyboardEvent)
{
  if (props.loading) return
  // 仅在可能产生选区的按键时检测
  if (!e.shiftKey && !(e.ctrlKey && e.key === 'a') && !(e.metaKey && e.key === 'a')) return
  checkAndShowToolbar()
}

/** 通用选区检测 + 弹出逻辑（mouseup / keyup 共用） */
function checkAndShowToolbar()
{
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) return

  const text = selection.toString().trim()
  if (text.length < props.minLength) return

  if (props.container && !props.container.contains(selection.anchorNode)) return

  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()

  selectedText.value = text
  flipped.value = false
  pos.value = {
    top: rect.top + window.scrollY - 8,
    left: rect.left + window.scrollX + rect.width / 2,
  }

  clearHideTimer()
  visible.value = true
  nextTick(adjustPosition)
}

/** 选区变化监听：选区清空时延迟隐藏 */
function handleSelectionChange() {
  if (props.loading) return

  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || !selection.toString().trim()) {
    scheduleHide()
  }
}

function scheduleHide() {
  clearHideTimer()
  hideTimer = setTimeout(() => {
    visible.value = false
    selectedText.value = ''
  }, props.hideDelay)
}

function clearHideTimer() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

/** 手动隐藏 */
function hide() {
  clearHideTimer()
  visible.value = false
  selectedText.value = ''
}

/** UToolbar 操作项点击 → 补充 selectedText 后转发 */
function handleToolbarAction(key: string) {
  if (!selectedText.value) return
  emit('action', key, selectedText.value)
}

watch(visible, (val) => {
  emit('visible-change', val)
})

onMounted(() => {
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('keyup', handleKeyUp)
  document.addEventListener('selectionchange', handleSelectionChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('keyup', handleKeyUp)
  document.removeEventListener('selectionchange', handleSelectionChange)
  clearHideTimer()
})

defineExpose({ hide })
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
