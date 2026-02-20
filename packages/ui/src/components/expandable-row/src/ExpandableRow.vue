<!--
  ExpandableRow 可展开行：一行摘要 + 下方可展开内容，由 open 控制，带高度过渡动画。
  展开分两帧：首帧仅触发布局（grid 1fr），次帧再显示内容并做透明度过渡，避免布局与绘制挤在同一帧造成卡顿。
-->
<template>
  <div class="u-expandable-row">
    <div class="u-expandable-row__line">
      <slot name="summary" />
    </div>
    <div
      class="u-expandable-row__wrap"
      :class="{ 'is-open': open, 'is-open-visible': openVisible }"
      :style="wrapStyle"
    >
      <div class="u-expandable-row__expand">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import type { UExpandableRowProps } from '../types'

defineOptions({
  name: 'UExpandableRow'
})

const props = withDefaults(defineProps<UExpandableRowProps>(), {
  open: false,
  duration: 280
})

const wrapStyle = computed(() => ({
  '--u-expandable-duration': `${props.duration}ms`
}))

/** 展开“可见”滞后一帧，使布局帧与绘制帧分离，减轻单帧卡顿 */
const openVisible = ref(false)
watch(
  () => props.open,
  (open) => {
    if (!open) {
      openVisible.value = false
      return
    }
    openVisible.value = false
    nextTick(() => {
      requestAnimationFrame(() => {
        openVisible.value = true
      })
    })
  },
  { immediate: true }
)
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
