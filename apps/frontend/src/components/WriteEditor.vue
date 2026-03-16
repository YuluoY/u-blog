<template>
  <div ref="editorWrapRef" class="write-editor-wrap">
    <MdEditor
      v-model="content"
      :theme="theme"
      :code-style-reverse="false"
      class="write-view__editor"
      :toolbars="toolbars"
      :def-toolbars="defToolbars"
      :on-save="onSave"
      @on-save="onSave"
      :on-upload-img="onUploadImg"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { MdEditor, allToolbar, type ToolbarNames } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

/** 有自定义工具栏时，在「保存」右侧插入索引 0，使 defToolbars 第一个按钮显示 */
const toolbars = computed((): ToolbarNames[] | undefined =>
{
  if (!props.defToolbars) return undefined
  const arr = allToolbar as unknown as ToolbarNames[]
  const eqIdx = (arr as (string | number)[]).indexOf('=')
  const left = (arr as (string | number)[]).slice(0, eqIdx >= 0 ? eqIdx : undefined)
  const right = eqIdx >= 0 ? (arr as (string | number)[]).slice(eqIdx) : []
  return [...left, 0, ...right] as ToolbarNames[]
})

defineOptions({
  name: 'WriteEditor'
})

const props = withDefaults(
  defineProps<{
    initialContent: string
    theme?: 'light' | 'dark'
    defToolbars?: unknown
  }>(),
  {
    theme: 'light',
    defToolbars: undefined
  }
)

const emit = defineEmits<{
  (e: 'update:content', value: string): void
  (e: 'save', value: string): void
}>()

const content = ref(props.initialContent || '')
const editorWrapRef = ref<HTMLElement | null>(null)
let syncFromInitialDone = false
let debounceTimer: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_MS = 250

watch(
  () => props.initialContent,
  val =>
  {
    if (syncFromInitialDone) return
    if (content.value === '' && val !== '')
    {
      content.value = val
      syncFromInitialDone = true
    }
  },
  { immediate: true }
)

watch(
  content,
  val =>
  {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() =>
    {
      emit('update:content', val)
      debounceTimer = null
    }, DEBOUNCE_MS)
  },
  { deep: false }
)

function onSave(_value?: string, _htmlPromise?: Promise<string>)
{
  const value = content.value
  emit('update:content', value)
  emit('save', value)
}

function onUploadImg(files: File[], callback: (urls: string[]) => void)
{
  const urls: string[] = []
  let done = 0
  const total = files.length
  if (total === 0)
  {
    callback([])
    return
  }
  files.forEach(file =>
  {
    const reader = new FileReader()
    reader.onload = () =>
    {
      urls.push(reader.result as string)
      done += 1
      if (done === total) callback(urls)
    }
    reader.onerror = () =>
    {
      done += 1
      if (done === total) callback(urls)
    }
    reader.readAsDataURL(file)
  })
}

function getContent(): string
{
  return content.value
}

function setContent(val: string): void
{
  content.value = val
  syncFromInitialDone = true
}

function flushSync(): void
{
  if (debounceTimer)
  {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  emit('update:content', content.value)
}

defineExpose({
  getContent,
  setContent,
  flushSync
})
</script>

<style scoped>
.write-editor-wrap {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 320px;
}

.write-view__editor {
  flex: 1;
  min-height: 320px;
}

/* 压低代码块 sticky header 的 z-index，避免穿透 UDrawer 遮罩层（md-editor-v3 默认 10000） */
.write-editor-wrap :deep(.md-editor-code-head) {
  z-index: 10 !important;
}

/* 撰写预览区：文章段落首行缩进 */
.write-editor-wrap :deep(.md-editor-preview > p) {
  text-indent: 2em;
}

/* ========== 编辑器选中文本高亮 ========== */

/* 预览区 / 非 CodeMirror 区域：原生 ::selection */
.write-editor-wrap :deep(::selection) {
  background: var(--u-primary-light-4, rgba(0, 123, 255, 0.35));
  color: var(--u-text-1, inherit);
}

/* CodeMirror 编辑区：未聚焦时的选区背景 */
.write-editor-wrap :deep(.cm-selectionBackground) {
  background: var(--u-primary-light-6, rgba(0, 123, 255, 0.2)) !important;
}

/* CodeMirror 编辑区：聚焦时的选区背景（更醒目） */
.write-editor-wrap :deep(.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground) {
  background: var(--u-primary-light-4, rgba(0, 123, 255, 0.35)) !important;
}

/* 暗色模式下选区背景 */
:root.dark .write-editor-wrap :deep(.cm-selectionBackground) {
  background: var(--u-primary-light-8, rgba(0, 123, 255, 0.25)) !important;
}

:root.dark .write-editor-wrap :deep(.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground) {
  background: var(--u-primary-light-6, rgba(0, 123, 255, 0.35)) !important;
}
</style>
