<!--
  Image 图片：支持 fit/尺寸/圆角、加载态与错误态、可选预览点击，暴露 reload。
-->
<template>
  <div 
    class="u-image"
    :class="{ 'is-previewable': previewable }"
    :style="containerStyle"
    @click="handleClick"
  >
    <img
      v-if="!loadError"
      ref="imgRef"
      :src="currentSrc"
      :alt="alt"
      :loading="loading"
      :style="imageStyle"
      class="u-image__inner"
      :aria-label="alt"
      @load="handleLoad"
      @error="handleError"
    />
    <div v-else class="u-image__error">
      <slot name="error">
        <div class="u-image__error-icon">
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M304 416a112 112 0 100 224 112 112 0 000-224zm0 160a48 48 0 110-96 48 48 0 010 96zm528-128v384H192V448h640zm64-64H128a64 64 0 00-64 64v448a64 64 0 0064 64h768a64 64 0 0064-64V448a64 64 0 00-64-64z"></path>
            <path fill="currentColor" d="M96 384h128v64H96zM224 320h128v64H224zM352 256h128v64H352zM480 192h128v64H480zM608 128h128v64H608zM736 64h128v64H736z"></path>
          </svg>
        </div>
        <div class="u-image__error-text">{{ t('image.error') }}</div>
      </slot>
    </div>
    <div v-if="isLoading && showLoading" class="u-image__loading">
      <slot name="loading">
        <div class="u-image__loading-spinner"></div>
      </slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, type CSSProperties } from 'vue'
import type { UImageProps, UImageEmits, UImageExposes } from '../types'
import { useLocale } from '@/components/config-provider'

defineOptions({
  name: 'UImage'
})

const { t } = useLocale()

const props = withDefaults(defineProps<UImageProps>(), {
  alt: '',
  fit: 'cover',
  loading: 'lazy',
  showLoading: true,
  previewable: false,
  lazy: false
})

const emits = defineEmits<UImageEmits>()

const imgRef = ref<HTMLImageElement | null>(null)
const isLoading = ref(true)
const loadError = ref(false)
const currentSrc = ref(props.src)

watch(() => props.src, (newSrc) => {
  currentSrc.value = newSrc
  isLoading.value = true
  loadError.value = false
})

// 容器宽高、圆角，数字按 px 处理
const containerStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {}
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  if (props.radius) {
    style.borderRadius = typeof props.radius === 'number' ? `${props.radius}px` : props.radius
  }
  return style
})

const imageStyle = computed<CSSProperties>(() => ({
  objectFit: props.fit
}))

function handleLoad(event: Event) {
  isLoading.value = false
  loadError.value = false
  emits('load', event)
}

function handleError(event: Event) {
  isLoading.value = false
  loadError.value = true
  if (props.errorSrc && currentSrc.value !== props.errorSrc) {
    currentSrc.value = props.errorSrc
    loadError.value = false
  } else {
    emits('error', event)
  }
}

function handleClick(event: MouseEvent) {
  emits('click', event)
  if (props.previewable && !loadError.value) {
    console.log('Image preview feature not implemented yet')
  }
}

/** 重新加载当前 src（先清空再赋值以触发加载） */
function reload() {
  const src = props.src
  currentSrc.value = ''
  isLoading.value = true
  loadError.value = false
  setTimeout(() => {
    currentSrc.value = src
  }, 0)
}

defineExpose<UImageExposes>({
  reload
})
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
