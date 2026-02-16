<!--
  Badge 徽标：在子元素上展示数字、红点或自定义内容，支持最大值、偏移、类型等。
-->
<template>
  <div class="u-badge">
    <div
      v-if="showBadge"
      class="u-badge-content"
      :class="[badgeClass, `u-badge-${type}`]"
      :style="_badgeStyle"
    >
      {{ _value }}
    </div>
    <div
      v-else-if="isDot"
      class="u-badge-dot"
      :class="`u-badge-dot-${type}`"
    />
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { UBadgeProps } from '../types'
import { isNumber } from 'lodash-es'
import { pxToRem } from '@u-blog/utils'

defineOptions({
  name: 'UBadge'
})

/** 合并默认的 props */
const props = withDefaults(defineProps<UBadgeProps>(), {
  value: 0,
  max: 99,
  isDot: false,
  hidden: false,
  type: 'danger',
  showZero: true,
  offset: () => [0, 0],
})

// 是否为数字型徽标（用于判断是否显示 max+）
const isNumberBadge = computed(() => isNumber(Number(props.value)))
// 是否显示数字徽标（非红点、未隐藏且数值或 showZero 为真）
const showBadge = computed(() => !props.isDot && !props.hidden && (props.showZero || props.value))
// 显示值：超过 max 时显示 "max+"
const _value = computed(() => isNumberBadge.value && Number(props.value) > props.max ? props.max + '+' : props.value)

/**
 * 徽标样式：合并自定义样式、背景色，偏移量由设计稿 px 转 rem 以参与响应式
 */
const _badgeStyle = computed(() =>
{
  return {
    ...props.badgeStyle,
    backgroundColor: props.color,
    right: pxToRem(props.offset[0]),
    top: pxToRem(props.offset[1]),
  }
})
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
