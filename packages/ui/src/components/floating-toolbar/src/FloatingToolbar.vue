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
        class="u-floating-toolbar"
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
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

  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) return

  const text = selection.toString().trim()
  if (text.length < props.minLength) return

  if (props.container && !props.container.contains(selection.anchorNode)) return

  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()

  selectedText.value = text
  pos.value = {
    top: rect.top + window.scrollY - 8,
    left: rect.left + window.scrollX + rect.width / 2,
  }

  clearHideTimer()
  visible.value = true
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
  document.addEventListener('selectionchange', handleSelectionChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('selectionchange', handleSelectionChange)
  clearHideTimer()
})

defineExpose({ hide })
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
