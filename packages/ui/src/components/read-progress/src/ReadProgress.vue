
<template>
  <div
    v-show="showProgress"
    class="u-read-progress"
    :style="progressStyle"
  >
    <div
      class="u-read-progress__bar"
      :class="`u-read-progress__bar--${type}`"
      :style="{
        width: `${progress}%`,
        backgroundColor: props.color,
        willChange: 'width'
      }"
    />
    <div
      v-if="showText && progress"
      class="u-read-progress__text"
    >
      <slot>
        <u-text
          :size="textSize"
          :type="textType || type"
        >
          {{ _content }}
        </u-text>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import type { UReadProgressEmits, UReadProgressProps } from '../types'
import { pxToRem } from '@u-blog/utils'
import { useEventListener, useWatchRef } from '@u-blog/composables'
import { UText } from '@/components'

defineOptions({
  name: 'UReadProgress'
})

const props = withDefaults(defineProps<UReadProgressProps>(), {
  type: 'primary',
  height: 4,
  show: true,
  backgroundColor: 'transparent',
  showText: false,
  content: '',
  textSize: 'default'
})
const emits = defineEmits<UReadProgressEmits>()

const progress = useWatchRef(props.modelValue || 0, () => props.modelValue)
const showProgress = useWatchRef(props.show, () => props.show)

const _content = computed(() => props.content ? props.content : `${Math.round(progress.value)}%`)
const progressStyle = computed<CSSProperties>(() => ({
  height: pxToRem(props.height as number),
  backgroundColor: props.backgroundColor,
}))

useEventListener(document, 'scroll', () =>
{
  window.requestAnimationFrame(() =>
  {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight
    const clientHeight = document.documentElement.clientHeight || document.body.clientHeight
    progress.value = (scrollTop / (scrollHeight - clientHeight)) * 100
    emits('update:modelValue', progress.value)
    emits('change')
  })
})

function hide()
{
  showProgress.value = false
}

function show()
{
  showProgress.value = true
}

defineExpose({
  progress,
  hide,
  show
})

</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>