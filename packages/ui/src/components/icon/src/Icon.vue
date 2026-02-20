<!--
  Icon 图标：封装 FontAwesome，支持 type、color、aria 与装饰性图标语义。
-->
<template>
  <i
    class="u-icon"
    :class="{ [`u-icon--${type}`]: type }"
    :style="iconStyles"
    :aria-hidden="decorative"
    :aria-label="decorative ? undefined : (ariaLabel ?? title)"
    v-bind="$attrs"
  >
    <font-awesome-icon v-bind="filterProps" />
  </i>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import type { UIconProps } from '../types'
import { omit } from 'lodash-es'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

defineOptions({
  name: 'UIcon',
  inheritAttrs: false
})

const props = withDefaults(defineProps<UIconProps>(), {
  decorative: undefined
})
// 未显式设置时：无 ariaLabel 且无 title 则视为装饰性
const decorative = computed(() => props.decorative ?? !(props.ariaLabel ?? props.title))
// 传给 FontAwesomeIcon 的 props；FontAwesomeIcon 的 size 校验不包含 'md'（见 FortAwesome/vue-fontawesome#493），将 'md' 映射为 '1x'
const filterProps = computed<any>(() => {
  const rest = omit(props, ['type', 'color', 'ariaLabel', 'decorative'])
  return { ...rest, size: rest.size === 'md' ? '1x' : rest.size }
})
const iconStyles = computed<CSSProperties>(() => ({ color: props.color ?? void 0 }))

</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>