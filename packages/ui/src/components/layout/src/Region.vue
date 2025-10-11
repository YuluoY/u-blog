<template>
  <section
    :class="['u-region', `u-region__${region}`, 'u-region-container']"
    :style="regionStyle"
  >
    <slot />
  </section>
</template>

<script setup lang="ts">
import { isNil, isNumber } from 'lodash-es'

import { pxToRem } from '@u-blog/utils' 
import type { URegionProps, ULayoutContext } from '../types'
import { CComponentName, CLayoutContext, CLayoutMode } from '../consts'
import { type VNode, type CSSProperties, computed, getCurrentInstance, inject, shallowRef } from 'vue'

defineOptions({
  name: 'URegion',
})

const instance = getCurrentInstance()

const props = withDefaults(defineProps<URegionProps>(), {
  region: 'center'
})

/**
 * 上下文
 */
const ctx = inject<ULayoutContext>(CLayoutContext)

/**
 * 最大列数
 */
const maxSpan = computed(() => ctx?.maxSpan?.value!)

/**
 * 同级dom
 */
const siblings = shallowRef((instance?.parent?.subTree.children as VNode[])?.[0]?.children as VNode[])
/**
 * region组件
 */
const siblingRegions = computed(() => siblings.value.filter(item => (item.type as any)?.name === CComponentName.REGION))
/**
 * region没有span的组件
 */
const siblingRegionsWithoutSpan = computed(() => siblingRegions.value.filter(item => isNil(item.props?.span)))

/**
 * 列数
 */
const span = computed(() =>
{
  if (props.span)
    return props.span
  if (siblingRegionsWithoutSpan.value.length === 0)
    return 0
  const { surplus } = handleRowSpan(siblingRegions.value)
  return surplus / siblingRegionsWithoutSpan.value.length
})

/**
 * 区域样式
 */
const regionStyle = computed<CSSProperties>(() =>
{
  const style = {
    ...props.style
  } as CSSProperties

  if (span.value)
    style['--u-layout-flex-size'] = span.value
  if (maxSpan.value && ctx?.mode.value === CLayoutMode.ROW)
    style['--u-layout-max-span'] = maxSpan.value

  if (!isNil(props.padding))
    style.padding = isNumber(props.padding) ? pxToRem(props.padding) : props.padding

  if (!isNil(props.justify))
    style.justifyContent = props.justify

  if (!isNil(props.align))
    style.alignItems = props.align

  if (!isNil(props.direction))
    style.flexDirection = props.direction

  if (!isNil(props.gap))
    style.gap = isNumber(props.gap) ? pxToRem(props.gap) : props.gap

  return style
})

/**
 * 计算行跨度
 * @param regions 同级组件
 */
function handleRowSpan(regions: VNode[])
{
  let total = 0
  let surplus = 0

  for (const region of regions)
    total += region.props?.span || 0

  surplus = maxSpan.value - total
  
  return {
    total,
    surplus
  }
}

</script>