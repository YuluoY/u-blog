<!--
  Tag 标签：类型/尺寸/效果/圆角/边框，可关闭，关闭图标可左可右，点击与 close 事件分离。
-->
<template>
  <div
    :class="[
      'u-tag',
      {
        [`u-tag--${type}`]: type,
        [`u-tag--${size}`]: size,
        [`u-tag--${effect}`]: effect,
        'is-round': round,
        'is-border': border,
        'is-transition': transition
      },
    ]"
    :style="customColorStyle"
    :role="closable ? 'button' : undefined"
    :tabindex="closable ? 0 : undefined"
    @click="onClick"
  >
    <span
      v-if="closable && isCloseIconLeft"
      :class="['u-tag__close', { [`u-tag__close--${closePosition}`]: closePosition }]"
      aria-hidden="true"
    >
      <u-icon icon="close" />
    </span>
    <span
      v-if="$slots.default"
      class="u-tag__content"
    >
      <slot />
    </span>
    <span
      v-if="closable && !isCloseIconLeft"
      :class="['u-tag__close', { [`u-tag__close--${closePosition}`]: closePosition }]"
      aria-hidden="true"
    >
      <u-icon icon="close" />
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import type { UTagEmits, UTagProps } from '../types'
import { CTagClosePosition } from '../consts'
import { UIcon } from '@/components/icon'

defineOptions({
  name: 'UTag'
})
const props = withDefaults(defineProps<UTagProps>(), {
  type: 'primary',
  size: 'default',
  effect: 'plain',
  transition: true,
  closePosition: 'default',
  triggerClick: false
})
const emits = defineEmits<UTagEmits>()

const isCloseIconLeft = computed(() => props.closePosition === CTagClosePosition.LEFT)

/**
 * 将 hex 颜色转为 rgba，用于生成半透明背景
 * 支持 #RGB / #RRGGBB / #RRGGBBAA 格式
 */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  let r: number, g: number, b: number
  if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16)
    g = parseInt(h[1] + h[1], 16)
    b = parseInt(h[2] + h[2], 16)
  } else {
    r = parseInt(h.slice(0, 2), 16)
    g = parseInt(h.slice(2, 4), 16)
    b = parseInt(h.slice(4, 6), 16)
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * 计算自定义颜色的动态样式：
 * - 背景：color 的 15% 透明度（柔和半透明）
 * - 文字：color 原色
 * - 如果显式传了 textColor，优先使用 textColor
 */
const customColorStyle = computed<CSSProperties | undefined>(() => {
  if (!props.color) return undefined
  const c = props.color as string
  // 仅处理 hex 格式的颜色值
  if (c.startsWith('#')) {
    return {
      backgroundColor: hexToRgba(c, 0.12),
      color: props.textColor || c,
      borderColor: 'transparent',
    }
  }
  // 非 hex 格式（如 CSS 渐变），回退为直接 backgroundColor
  return {
    backgroundColor: c,
    color: props.textColor || undefined,
  }
})

/** 点击关闭图标时派发 close，可选同时派发 click；否则仅派发 click */
const onClick = (event: MouseEvent): void => {
  if ((event.target as HTMLElement).closest?.('.u-tag__close')) {
    emits('close', event)
    if (props.triggerClick) emits('click', event)
    return
  }
  emits('click', event)
}
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>