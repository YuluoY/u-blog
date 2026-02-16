<!--
  CollapseTransition 折叠过渡：基于 maxHeight/padding 的展开收起动画钩子。
-->
<template>
  <transition
    name="u-collapse-transition"
    v-on="on"
  >
    <slot />
  </transition>
</template>
<script lang="ts" setup>
import type { RendererElement } from 'vue'

defineOptions({
  name: 'UCollapseTransition',
})

/**
 * 恢复元素内联样式为进入前保存的值
 */
const reset = (el: RendererElement) =>
{
  el.style.maxHeight = ''
  el.style.overflow = el.dataset.oldOverflow
  el.style.paddingTop = el.dataset.oldPaddingTop
  el.style.paddingBottom = el.dataset.oldPaddingBottom
}

/**
 * 折叠过渡钩子：进入时从 0 展开到 scrollHeight，离开时收起到 0
 */
const on = {
  beforeEnter(el: RendererElement)
  {
    if (!el.dataset) el.dataset = {}

    el.dataset.oldPaddingTop = el.style.paddingTop
    el.dataset.oldPaddingBottom = el.style.paddingBottom
    if (el.style.height) el.dataset.elExistsHeight = el.style.height

    el.style.maxHeight = 0
    el.style.paddingTop = 0
    el.style.paddingBottom = 0
  },

  enter(el: RendererElement)
  {
    requestAnimationFrame(() =>
    {
      el.dataset.oldOverflow = el.style.overflow
      if (el.dataset.elExistsHeight)
      
        el.style.maxHeight = el.dataset.elExistsHeight
      
      else if (el.scrollHeight !== 0)
      
        el.style.maxHeight = `${el.scrollHeight}px`
      
      else
      
        el.style.maxHeight = 0
      

      el.style.paddingTop = el.dataset.oldPaddingTop
      el.style.paddingBottom = el.dataset.oldPaddingBottom
      el.style.overflow = 'hidden'
    })
  },

  afterEnter(el: RendererElement)
  {
    el.style.maxHeight = ''
    el.style.overflow = el.dataset.oldOverflow
  },

  enterCancelled(el: RendererElement)
  {
    reset(el)
  },

  beforeLeave(el: RendererElement)
  {
    if (!el.dataset) el.dataset = {}
    el.dataset.oldPaddingTop = el.style.paddingTop
    el.dataset.oldPaddingBottom = el.style.paddingBottom
    el.dataset.oldOverflow = el.style.overflow

    el.style.maxHeight = `${el.scrollHeight}px`
    el.style.overflow = 'hidden'
  },

  leave(el: RendererElement)
  {
    if (el.scrollHeight !== 0)
    {
      el.style.maxHeight = 0
      el.style.paddingTop = 0
      el.style.paddingBottom = 0
    }
  },

  afterLeave(el: RendererElement)
  {
    reset(el)
  },

  leaveCancelled(el: RendererElement)
  {
    reset(el)
  },
}
</script>