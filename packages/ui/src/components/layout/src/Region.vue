<!--
  Region 布局区域：作为 Layout 子区域，支持 span/region/padding/justify/align/direction/gap，与同级 Region 分配剩余列数。
-->
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

const ctx = inject<ULayoutContext>(CLayoutContext)
const maxSpan = computed(() => ctx?.maxSpan?.value!)
const siblings = shallowRef((instance?.parent?.subTree.children as VNode[])?.[0]?.children as VNode[])
const siblingRegions = computed(() => siblings.value.filter(item => (item.type as any)?.name === CComponentName.REGION))
const siblingRegionsWithoutSpan = computed(() => siblingRegions.value.filter(item => isNil(item.props?.span)))

// 有 span 用 props.span，否则在未指定 span 的兄弟间平分剩余列数
const span = computed(() =>
{
  if (props.span)
    return props.span
  if (siblingRegionsWithoutSpan.value.length === 0)
    return 0
  const { surplus } = handleRowSpan(siblingRegions.value)
  return surplus / siblingRegionsWithoutSpan.value.length
})

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
 * 计算已占列数与剩余列数，供未指定 span 的 Region 平分
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