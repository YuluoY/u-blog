<!--
  StatsBar 比例条：按 segments 数值显示比例色条，用于统计、归档卡片等。
-->
<template>
  <div
    class="u-stats-bar"
    role="presentation"
    :style="trackStyle"
  >
    <span
      v-for="(seg, i) in normalizedSegments"
      :key="i"
      class="u-stats-bar__seg"
      :style="segmentStyle(seg)"
      :title="seg.label ?? String(seg.value)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { UStatsBarProps, UStatsBarSegment } from '../types'

defineOptions({
  name: 'UStatsBar'
})

const props = withDefaults(defineProps<UStatsBarProps>(), {
  segments: () => [],
  height: '6px',
  segmentMinPct: 5,
  trackColor: ''
})

const DEFAULT_COLORS = ['var(--u-info)', 'var(--u-danger)', 'var(--u-success)']

const total = computed(() => {
  if (props.max != null && props.max > 0) return props.max
  const sum = props.segments.reduce((s, seg) => s + seg.value, 0)
  return sum || 1
})

const normalizedSegments = computed(() => {
  const list = props.segments
  if (list.length === 0) return []
  const t = total.value
  return list.map((seg, i) => {
    const pct = t ? Math.max(props.segmentMinPct, (seg.value / t) * 100) : props.segmentMinPct
    return {
      ...seg,
      color: seg.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      pct
    }
  })
})

const trackStyle = computed(() => ({
  '--u-stats-bar-height': props.height,
  '--u-stats-bar-track': props.trackColor || 'var(--u-background-4)'
}))

function segmentStyle(seg: UStatsBarSegment & { color: string; pct: number }) {
  return {
    flex: `0 0 ${seg.pct}%`,
    backgroundColor: seg.color
  }
}
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
