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
    :style="{backgroundColor: color}"
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