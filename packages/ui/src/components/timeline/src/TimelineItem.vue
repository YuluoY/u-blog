<template>
  <div class="u-timeline-item">
    <div
      v-if="!icon"
      class="u-timeline-item-dot"
      :class="classList"
      :style="{ color: props.color }"
      @click="handleDotClick($event)"
    >
    </div>
    <u-icon
      v-else-if="icon"
      class="u-timeline-item-dot"
      :class="classList"
      v-bind="iconProps"
      :icon="icon"
      :style="{ color: props.color }"
      @click="handleDotClick($event)"
    />
    <component
      v-else-if="isVNode(icon) || isFunction(icon)"
      class="u-timeline-item-dot"
      :class="classList"
      :style="{ color: props.color }"
      :is="icon"
      @click="handleDotClick($event)"
    />
    <div class="u-timeline-item__inner">
      <div
        v-if="placement === CTimelinePlacement.TOP"
        class="u-timeline-item-date"
      >
        <slot name="date">
          {{ date }}
        </slot>
      </div>
      <div class="u-timeline-item-content">
        <slot>
          {{ content }}
        </slot>
      </div>
      <div
        v-if="placement === CTimelinePlacement.BOTTOM"
        class="u-timeline-item-date"
      >
        <slot name="date">
          {{ date }}
        </slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { isFunction } from 'lodash-es'
import { UIcon } from '@/components'
import type { UTimelineItemEmits, UTimelineItemProps } from '../types'
import { CTimelinePlacement, CTimelineContextKey } from '../consts'
import { computed, effectScope, inject, isVNode, onBeforeUnmount, watch } from 'vue'

defineOptions({
  name: 'UTimelineItem'
})

const emits = defineEmits<UTimelineItemEmits>()
const props = withDefaults(defineProps<UTimelineItemProps>(), {
  placement: 'top',
  type: 'primary',
  size: 'normal',
  position: 'left',
  hollow: false
})

const timelineContext = inject(CTimelineContextKey)

const scope = effectScope()

const classList = computed(() => [
  `u-timeline-item-dot--${props.type}`,
  `u-timeline-item-dot--${props.size}`,
  `u-timeline-item-dot--${props.position}`,
  { 'u-timeline-item-dot--hollow': props.hollow }
])

const handleDotClick = (evt: MouseEvent) =>
{
  emits('dot-click', evt, { ...props })
  props.dotClick?.(evt, { ...props })
}

scope.run(() =>
{
  watch(() => props.position, () =>
  {
    timelineContext?.onCalcLine()
  }, {
    flush: 'post'
  })
})

onBeforeUnmount(() =>
{
  scope.stop()
})

</script>