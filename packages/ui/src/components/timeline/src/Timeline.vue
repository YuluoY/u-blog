<template>
  <div
    ref="timelineRef"
    class="u-timeline"
    :class="`u-timeline--${direction}`"
    :style="styles"
  >
    <div class="u-timeline-line" :style="lineStyle"></div>
    <slot>
      <TimelineItem
        v-for="item in data"
        :key="`${uid}-${item.date?.toString()}`"
        v-bind="item"
      />
    </slot>
  </div>
</template>

<script lang="ts" setup>
import type { UTimelineItemProps, UTimelineProps } from '../types'
import TimelineItem from './TimelineItem.vue'
import { CTimelineContextKey, CTimelineDirection } from '../consts'
import { pxToRem } from '@u-blog/utils'
import { computed, onBeforeUnmount, provide, ref, shallowRef, useId, watch, type CSSProperties } from 'vue'
import { debounce } from 'lodash-es'

defineOptions({
  name: 'UTimeline'
})

const uid = useId()

const props = withDefaults(defineProps<UTimelineProps>(), {
  data: (() => [] as UTimelineItemProps[]),
  direction: 'vertical',
  gutter: 30,
  margin: 20,
  lineColor: ''
})

const timelineRef = ref<HTMLElement | null>(null)

const gutter = computed(() => props.gutter ? pxToRem(props.gutter) : props.gutter)
const margin = computed(() => props.margin ? pxToRem(props.margin) : props.margin)

const lineStyle = shallowRef<CSSProperties>({})

/**
 * 自动计算线位置
 */
const onCalcLine = () =>
{
  const firstItemNode = timelineRef.value?.querySelector('.u-timeline-item') as HTMLElement | null
  const lastItemNode = timelineRef.value?.querySelector('.u-timeline-item:last-of-type') as HTMLElement | null
  
  if (!firstItemNode || !lastItemNode || firstItemNode === lastItemNode)
    return
  const firstDot = firstItemNode.children[0] as HTMLElement
  const lastDot = lastItemNode.children[0] as HTMLElement
  const firstDotRect = firstDot.getBoundingClientRect()
  const lastDotRect = lastDot.getBoundingClientRect()

  if (props.direction === CTimelineDirection.HORIZONTAL)
  {
    lineStyle.value = {
      width: lastDotRect.left - firstDotRect.left + 'px',
      left: firstDot.offsetLeft + 'px'
    }
  }
  else if (props.direction === CTimelineDirection.VERTICAL)
  {
    lineStyle.value = {
      height: lastDotRect.top - firstDotRect.top + 'px',
      top: firstDot.offsetTop + 'px'
    }
  }
}

const onDebouncedCalcLine = debounce(onCalcLine, 200)

const watcher = watch(() => [props.direction, props.data.length], () =>
{
  onDebouncedCalcLine()
}, {
  immediate: true,
  flush: 'post'
})

const styles = computed(() => ({
  '--timeline-gutter': gutter.value,
  '--timeline-margin': margin.value,
  '--timeline-line-color': props.lineColor || 'var(--uc-background-4)',
}))

provide(CTimelineContextKey, {
  onCalcLine: onDebouncedCalcLine
})

onBeforeUnmount(() =>
{
  watcher()
})
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>