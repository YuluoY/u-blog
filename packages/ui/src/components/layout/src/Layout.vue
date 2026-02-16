<!--
  Layout 布局：根据 mode 渲染默认插槽或 useLayoutMode 处理后的区域，提供 padding/gutter 与上下文（mode、maxSpan）。
-->
<template>
  <main
    :class="['u-layout', `u-layout__${mode}`]"
    :style="layoutStyle"
  >
    <component
      :is="processedSlot"
      v-if="mode === CLayoutMode.DEFAULT"
    />
    <slot v-else />
  </main>
</template>

<script setup lang="ts">
import { isNumber, isNil } from 'lodash-es'
import { pxToRem } from '@u-blog/utils'
import { useLayoutMode } from '../composables'
import {
  type CSSProperties,
  type SetupContext,
  useSlots,
  provide,
  computed,
} from 'vue'
import type { ULayoutProps, ULayoutMode } from '../types'
import {
  CLayoutMode,
  CLayoutContext,
  CMaxSpan,
} from '../consts' 

defineOptions({
  name: 'ULayout'
})

const props = withDefaults(defineProps<ULayoutProps>(), {
  mode: 'default',
})

const slots: SetupContext['slots'] = useSlots()

const {
  processedSlot
} = useLayoutMode({
  props,
  slots
})

// padding/gutter 支持数字转 rem
const layoutStyle = computed(() =>
{
  const style: CSSProperties = {}
  if (!isNil(props.padding))
    style.padding = isNumber(props.padding) ? pxToRem(props.padding) : props.padding
  if (!isNil(props.gutter))
    style.gap = isNumber(props.gutter) ? pxToRem(props.gutter) : props.gutter
  return style
})


provide(CLayoutContext, {
  mode: computed(() => props.mode as ULayoutMode),
  maxSpan: computed(() => props.maxSpan ?? CMaxSpan),
})
</script>

<style lang="scss">
@forward "../styles/index.scss";
</style>
