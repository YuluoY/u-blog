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

/**
 * 布局模式
 */
const {
  processedSlot
} = useLayoutMode({
  props,
  slots
})

/**
 * 布局样式
 */
const layoutStyle = computed(() =>
{
  const style: CSSProperties = {}
  if (!isNil(props.padding))
    style.padding = isNumber(props.padding) ? pxToRem(props.padding) : props.padding
  if (!isNil(props.gutter))
    style.gap = isNumber(props.gutter) ? pxToRem(props.gutter) : props.gutter
  return style
})


/**
 * 提供上下文信息
 */
provide(CLayoutContext, {
  mode: computed(() => props.mode as ULayoutMode),
  maxSpan: computed(() => props.maxSpan ?? CMaxSpan),
})
</script>

<style lang="scss">
@forward "../styles/index.scss";
</style>
