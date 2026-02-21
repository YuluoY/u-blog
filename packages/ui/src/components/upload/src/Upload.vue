<!--
  上传组件：支持拖拽 / 点击上传，picture-card 模式带图片预览与悬浮操作，
  校验文件类型与大小，v-model 绑定 base64 / URL 字符串。
-->
<template>
  <div class="u-upload" :class="rootClasses">
    <!-- picture-card 模式：有值时显示预览卡片 -->
    <div v-if="hasPreview" class="u-upload__card" :style="ratioStyle">
      <img :src="modelValue" class="u-upload__card-img" :style="{ objectFit: fit }" alt="" />
      <div class="u-upload__card-actions">
        <button
          v-if="!disabled"
          type="button"
          class="u-upload__card-action"
          :aria-label="t('upload.continue')"
          @click.stop="openFileDialog"
        >
          <u-icon :icon="['fas', 'pen']" />
        </button>
        <button
          v-if="!disabled"
          type="button"
          class="u-upload__card-action u-upload__card-action--danger"
          :aria-label="t('upload.delete')"
          @click.stop="handleRemove"
        >
          <u-icon :icon="['fas', 'trash-can']" />
        </button>
      </div>
    </div>

    <!-- 拖放 / 点击上传区域 -->
    <div
      v-if="showDragger"
      class="u-upload__dragger"
      :class="{ 'is-dragover': isDragover }"
      :style="ratioStyle"
      role="button"
      tabindex="0"
      @click="openFileDialog"
      @keydown.enter.space.prevent="openFileDialog"
      @dragover.prevent="onDragover"
      @dragleave.prevent="onDragleave"
      @drop.prevent="onDrop"
    >
      <slot>
        <div class="u-upload__dragger-body">
          <u-icon :icon="['fas', 'cloud-arrow-up']" class="u-upload__dragger-icon" />
          <span class="u-upload__dragger-text">
            {{ placeholder || t('upload.dragOrClick') }}
          </span>
        </div>
      </slot>
    </div>

    <!-- 隐藏原生 file input -->
    <input
      ref="inputRef"
      type="file"
      :accept="accept"
      :disabled="disabled"
      class="u-upload__input"
      @change="onFileChange"
    />

    <!-- 底部提示插槽 -->
    <div v-if="$slots.tip" class="u-upload__tip">
      <slot name="tip" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { UIcon } from '@/components/icon'
import { useLocale } from '@/components/config-provider'
import type { UUploadProps, UUploadEmits, UUploadExposes, UploadFile } from '../types'

defineOptions({
  name: 'UUpload',
  inheritAttrs: false,
})

const props = withDefaults(defineProps<UUploadProps>(), {
  accept: 'image/*',
  maxSize: 10,
  disabled: false,
  drag: true,
  listType: 'picture-card',
  fit: 'cover',
  aspectRatio: '16/9',
})

const emit = defineEmits<UUploadEmits>()
const { t } = useLocale()

const inputRef = ref<HTMLInputElement | null>(null)
const isDragover = ref(false)

/* ---------- 计算属性 ---------- */

const rootClasses = computed(() => [
  `u-upload--${props.listType}`,
  { 'is-disabled': props.disabled },
])

/** picture-card 模式下有值时显示预览卡片 */
const hasPreview = computed(() => props.listType === 'picture-card' && !!props.modelValue)

/** picture-card 模式下无值时显示拖放区 */
const showDragger = computed(() => !hasPreview.value)

/** 统一的宽高比内联样式 */
const ratioStyle = computed(() =>
  props.listType === 'picture-card' && props.aspectRatio
    ? { aspectRatio: props.aspectRatio }
    : {},
)

/* ---------- 文件处理 ---------- */

/** 打开原生文件选择器 */
function openFileDialog() {
  if (props.disabled) return
  inputRef.value?.click()
}

/** 文件选取回调 */
function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) processFile(file)
  // 重置 input，允许再次选择同一文件
  if (inputRef.value) inputRef.value.value = ''
}

/* ---------- 拖拽处理 ---------- */

function onDragover() {
  if (props.disabled || !props.drag) return
  isDragover.value = true
}

function onDragleave() {
  isDragover.value = false
}

function onDrop(e: DragEvent) {
  isDragover.value = false
  if (props.disabled || !props.drag) return
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  // 类型校验（与 accept 一致）
  if (props.accept && props.accept !== '*') {
    const accepted = props.accept.split(',').map((s) => s.trim())
    const ok = accepted.some((a) => {
      if (a.startsWith('.')) return file.name.toLowerCase().endsWith(a.toLowerCase())
      if (a.endsWith('/*')) return file.type.startsWith(a.replace('/*', '/'))
      return file.type === a
    })
    if (!ok) return
  }
  processFile(file)
}

/* ---------- 核心：读取文件 → base64 → 触发更新 ---------- */

function processFile(file: File) {
  // 大小校验
  if (props.maxSize && file.size > props.maxSize * 1024 * 1024) {
    emit('exceed', file)
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const url = reader.result as string
    const info: UploadFile = {
      name: file.name,
      size: file.size,
      type: file.type,
      url,
      raw: file,
    }
    emit('update:modelValue', url)
    emit('change', info)
  }
  reader.readAsDataURL(file)
}

/** 移除当前文件 */
function handleRemove() {
  emit('update:modelValue', '')
  emit('remove')
}

defineExpose<UUploadExposes>({
  openFileDialog,
  clear: handleRemove,
})
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
