<!--
  ReadProgress 阅读进度条：根据页面滚动计算 0–100% 进度，支持自定义颜色/高度/文案与国际化。
-->
<template>
  <div
    v-show="showProgress"
    class="u-read-progress"
    role="progressbar"
    :aria-valuenow="Math.round(progress)"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="t('readProgress.label')"
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
import { UText } from '@/components/text'
import { useLocale } from '@/components/config-provider'

defineOptions({
  name: 'UReadProgress'
})

const { t } = useLocale()

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

// 监听文档滚动，计算阅读进度并同步 modelValue
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

/** 隐藏进度条 */
function hide()
{
  showProgress.value = false
}

/** 显示进度条 */
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