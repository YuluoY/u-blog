<!--
  Text 文本：可设 tag/type/size，支持单行省略与多行 line-clamp（maxLine）。
-->
<template>
  <component
    :is="tag"
    class="u-text"
    :class="{
      [`u-text--${type}`]: type,
      [`u-text--${size}`]: size,
      'is-ellipsis': ellipsis,
      'is-limit-line': maxLine
    }"
    :style="styles"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import type { UTextProps } from '../types'

defineOptions({
  name: 'UText'
})
const props = withDefaults(defineProps<UTextProps>(), {
  type: 'default',
  size: 'default',
  ellipsis: false,
  tag: 'span'
})
// 多行截断时设置 line-clamp
const styles = computed<CSSProperties>(() => props.maxLine ? {
  'line-clamp': props.maxLine,
  '-webkit-line-clamp': props.maxLine
} : {})
</script>

<style lang="scss">
@forward '../styles/index.scss';

.u-text {
  &.is-limit-line {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
  }
}
</style>