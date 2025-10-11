
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
    @click="onClick"
  >
    <span
      v-if="closable && isCloseIconLeft"
      :class="[
        'u-tag__close',
        { [`u-tag__close--${closePosition}`]: closePosition }
      ]"
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
      :class="[
        'u-tag__close',
        { [`u-tag__close--${closePosition}`]: closePosition }
      ]"
    >
      <u-icon icon="close" />
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { UTagEmits, UTagProps } from '../types'
import { CTagClosePosition } from '../consts'
import { UIcon } from '@/components'

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

const onClick = (event: MouseEvent):void =>
{
  if ((event.target as HTMLElement).classList.contains('u-tag__close'))
  {
    emits('close', event)
    props.triggerClick && emits('click', event)
    return
  }
  emits('click', event)
}
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>