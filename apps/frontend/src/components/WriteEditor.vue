<template>
  <div ref="editorWrapRef" class="write-editor-wrap">
    <MdEditor
      ref="mdEditorRef"
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
        <NormalToolbar title="对当前行切换首行缩进" @onClick="toggleLineIndent">
          <svg
            class="md-editor-icon"
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
import { MdEditor, NormalToolbar, allToolbar, type ToolbarNames, type ExposeParam } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { ensureMdEditorConfig } from '@/utils/mdEditorSetup'

ensureMdEditorConfig()

const mdEditorRef = ref<ExposeParam>()

/** 全角空格缩进标记（两个 U+3000 IDEOGRAPHIC SPACE） */
const INDENT = '\u3000\u3000'

/**
 * 对光标所在行（或选区覆盖的所有行）切换首行缩进。
 * 已缩进则移除，未缩进则添加两个全角空格。
 */
function toggleLineIndent()
{
  const view = mdEditorRef.value?.getEditorView()
  if (!view) return

  const state = view.state
  const { from, to } = state.selection.main
  const startLine = state.doc.lineAt(from)
  const endLine = state.doc.lineAt(to)

  const changes: { from: number; to: number; insert: string }[] = []
  for (let i = startLine.number; i <= endLine.number; i++)
  {
    const line = state.doc.line(i)
    if (line.text.startsWith(INDENT))
    
      changes.push({ from: line.from, to: line.from + INDENT.length, insert: '' })
    
    else if (line.text.trim())
    
      changes.push({ from: line.from, to: line.from, insert: INDENT })
    
  }

  if (changes.length)
  
    view.dispatch({ changes })
  
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
