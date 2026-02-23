<!--
  BackTop 置顶按钮：固定在窗口右下角，滚动超过阈值后出现，点击平滑回到顶部。
  支持主题色、自定义图标、形状、阴影、拖拽定位（百分比坐标 + localStorage 持久化）。
-->
<template>
  <Teleport to="body">
    <Transition name="u-back-top-slide">
      <button
        v-show="isVisible"
        ref="btnRef"
        class="u-back-top"
        :class="[
          `u-back-top--${type}`,
          `u-back-top--${shape}`,
          { 'u-back-top--shadow': shadow, 'u-back-top--dragging': isDragging }
        ]"
        type="button"
        :aria-label="t('top.backToTop')"
        :style="positionStyle"
        @pointerdown="onPointerDown"
        @click="handleClick"
      >
        <slot>
          <!-- 默认箭头图标 -->
          <svg
            v-if="!icon"
            class="u-back-top__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
          <!-- 自定义图标 -->
          <i v-else :class="icon" class="u-back-top__custom-icon" />
        </slot>
      </button>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import type { UBackTopProps, UBackTopEmits, UBackTopExposes } from '../types'
import { pxToRem } from '@u-blog/utils'
import { useLocale } from '@/components/config-provider'

defineOptions({
  name: 'UBackTop'
})

const { t } = useLocale()

const props = withDefaults(defineProps<UBackTopProps>(), {
  type: 'primary',
  shape: 'circle',
  size: 44,
  right: 32,
  bottom: 40,
  visibilityHeight: 300,
  duration: 500,
  zIndex: 1000,
  shadow: true,
  draggable: false,
  storageKey: 'u-back-top-pos',
})
const emits = defineEmits<UBackTopEmits>()

/* ---- 状态 ---- */
const isVisible = ref(false)
const btnRef = ref<HTMLButtonElement | null>(null)
let scrollEl: HTMLElement | Window = window
let rafId: number | null = null

/* ---- 拖拽状态 ---- */
const isDragging = ref(false)
// 百分比坐标（0~100），从右下角计算
const dragRightPct = ref<number | null>(null)
const dragBottomPct = ref<number | null>(null)
let dragStartX = 0
let dragStartY = 0
let dragStartRight = 0
let dragStartBottom = 0
let hasMoved = false
// 拖拽判定阈值（px），超过此距离才视为拖拽
const DRAG_THRESHOLD = 4

/* ---- 同步外部 v-model ---- */
watch(() => props.modelValue, (val) => {
  if (val !== undefined) isVisible.value = val
})

watch(isVisible, (val) => {
  emits('update:modelValue', val)
})

/* ---- 样式 ---- */
const positionStyle = computed<CSSProperties>(() => {
  // 拖拽模式：使用百分比坐标
  if (props.draggable && dragRightPct.value !== null && dragBottomPct.value !== null) {
    return {
      width: pxToRem(props.size),
      height: pxToRem(props.size),
      right: `${dragRightPct.value}%`,
      bottom: `${dragBottomPct.value}%`,
      zIndex: props.zIndex,
    }
  }
  // 固定模式
  return {
    width: pxToRem(props.size),
    height: pxToRem(props.size),
    right: pxToRem(props.right),
    bottom: pxToRem(props.bottom),
    zIndex: props.zIndex,
  }
})

/* ---- 拖拽逻辑 ---- */

/** 从 localStorage 恢复拖拽位置 */
function restoreDragPosition() {
  if (!props.draggable) return
  try {
    const saved = localStorage.getItem(props.storageKey)
    if (saved) {
      const { right, bottom } = JSON.parse(saved)
      if (typeof right === 'number' && typeof bottom === 'number') {
        dragRightPct.value = clampPct(right)
        dragBottomPct.value = clampPct(bottom)
      }
    }
  } catch { /* ignore */ }
}

/** 保存位置到 localStorage */
function saveDragPosition() {
  if (dragRightPct.value === null || dragBottomPct.value === null) return
  try {
    localStorage.setItem(props.storageKey, JSON.stringify({
      right: dragRightPct.value,
      bottom: dragBottomPct.value,
    }))
  } catch { /* ignore */ }
}

/** 限制百分比范围：确保按钮不超出视窗 */
function clampPct(val: number): number {
  return Math.max(0, Math.min(val, 95))
}

function onPointerDown(e: PointerEvent) {
  if (!props.draggable) return

  hasMoved = false
  dragStartX = e.clientX
  dragStartY = e.clientY

  const vw = window.innerWidth
  const vh = window.innerHeight

  // 当前位置（百分比 → px）
  if (dragRightPct.value !== null && dragBottomPct.value !== null) {
    dragStartRight = (dragRightPct.value / 100) * vw
    dragStartBottom = (dragBottomPct.value / 100) * vh
  } else {
    dragStartRight = props.right
    dragStartBottom = props.bottom
  }

  // Pointer capture 保证拖出按钮范围仍可追踪
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)

  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  const dx = dragStartX - e.clientX
  const dy = dragStartY - e.clientY

  // 超过阈值才开始拖拽
  if (!hasMoved && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return
  hasMoved = true
  isDragging.value = true

  const vw = window.innerWidth
  const vh = window.innerHeight

  // 计算新的 right/bottom（px），再转百分比
  const newRight = dragStartRight + dx
  const newBottom = dragStartBottom + dy

  dragRightPct.value = clampPct((newRight / vw) * 100)
  dragBottomPct.value = clampPct((newBottom / vh) * 100)
}

function onPointerUp() {
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup', onPointerUp)

  if (hasMoved) {
    saveDragPosition()
    // 延迟重置，避免 pointerup 后立即触发 click
    requestAnimationFrame(() => {
      isDragging.value = false
    })
  }
}

/* ---- 滚动监听 ---- */
function getScrollTop(): number {
  if (scrollEl === window) {
    return document.documentElement.scrollTop || document.body.scrollTop
  }
  return (scrollEl as HTMLElement).scrollTop
}

function handleScroll() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    const scrollTop = getScrollTop()
    isVisible.value = scrollTop >= props.visibilityHeight
  })
}

onMounted(() => {
  if (props.target) {
    const el = document.querySelector(props.target)
    if (el) scrollEl = el as HTMLElement
  }

  // 使用 passive 监听提升性能
  const target = scrollEl === window ? window : scrollEl
  target.addEventListener('scroll', handleScroll, { passive: true })

  // 恢复拖拽位置
  restoreDragPosition()

  // 初始检查
  handleScroll()
})

onBeforeUnmount(() => {
  const target = scrollEl === window ? window : scrollEl
  target.removeEventListener('scroll', handleScroll)
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup', onPointerUp)
  if (rafId) cancelAnimationFrame(rafId)
})

/* ---- 滚动回顶部（缓动函数） ---- */
function scrollToTop() {
  const startTop = getScrollTop()
  if (startTop <= 0) return

  const startTime = performance.now()
  const duration = props.duration

  function step(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)

    // easeInOutCubic 缓动
    const ease = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2

    const scrollTarget = startTop * (1 - ease)

    if (scrollEl === window) {
      window.scrollTo(0, scrollTarget)
    } else {
      (scrollEl as HTMLElement).scrollTop = scrollTarget
    }

    if (progress < 1) {
      requestAnimationFrame(step)
    }
  }

  requestAnimationFrame(step)
}

function handleClick(e: MouseEvent) {
  // 拖拽结束时不触发回顶
  if (hasMoved) {
    hasMoved = false
    e.preventDefault()
    e.stopPropagation()
    return
  }
  scrollToTop()
  emits('click', e)
}

defineExpose<UBackTopExposes>({
  scrollToTop,
  get visible() {
    return isVisible.value
  }
})
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
