<template>
  <div ref="editorWrapRef" class="write-editor-wrap" :class="{ 'text-indent-on': textIndentEnabled }">
    <MdEditor
      v-model="content"
      :theme="theme"
      :code-style-reverse="false"
      class="write-view__editor"
      :toolbars="computedToolbars"
      :on-save="onSave"
      @on-save="onSave"
      :on-upload-img="onUploadImg"
    >
      <template #defToolbars>
        <NormalToolbar :title="textIndentEnabled ? '关闭首行缩进' : '开启首行缩进'" @onClick="toggleTextIndent">
          <svg
            class="md-editor-icon"
            :class="{ 'indent-active': textIndentEnabled }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <!-- 四条横线代表段落 -->
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
            <!-- 中间两行缩进 -->
            <line x1="7" y1="10" x2="21" y2="10" />
            <line x1="7" y1="14" x2="21" y2="14" />
            <!-- 缩进箭头 -->
            <polyline points="3,9 5,12 3,15" />
          </svg>
        </NormalToolbar>
      </template>
    </MdEditor>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { MdEditor, NormalToolbar, allToolbar, type ToolbarNames } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { STORAGE_KEYS } from '@/constants/storage'

/* ---------- 首行缩进偏好（localStorage 持久化） ---------- */
const textIndentEnabled = ref(
  localStorage.getItem(STORAGE_KEYS.TEXT_INDENT_ENABLED) !== '0' // 默认开启
)
function toggleTextIndent()
{
  textIndentEnabled.value = !textIndentEnabled.value
  localStorage.setItem(STORAGE_KEYS.TEXT_INDENT_ENABLED, textIndentEnabled.value ? '1' : '0')
}

/** 在「=」分隔符前插入自定义工具栏按钮（index 0 = defToolbars 第一个 slot 子节点），并移除内置 save 按钮 */
const computedToolbars = computed((): ToolbarNames[] =>
{
  const arr = (allToolbar as unknown as (string | number)[]).filter(item => item !== 'save')
  const eqIdx = arr.indexOf('=')
  const left = arr.slice(0, eqIdx >= 0 ? eqIdx : undefined)
  const right = eqIdx >= 0 ? arr.slice(eqIdx) : []
  return [...left, 0, ...right] as ToolbarNames[]
})

defineOptions({
  name: 'WriteEditor'
})

const props = withDefaults(
  defineProps<{
    initialContent: string
    theme?: 'light' | 'dark'
  }>(),
  {
    theme: 'light'
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

/* 撰写预览区：文章段落首行缩进（仅开启时应用） */
.write-editor-wrap.text-indent-on :deep(.md-editor-preview > p) {
  text-indent: 2em;
}

/* 首行缩进按钮激活态 */
.write-editor-wrap :deep(.indent-active) {
  color: var(--u-primary, #007bff);
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
