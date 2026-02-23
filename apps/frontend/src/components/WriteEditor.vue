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

    <!-- AI 浮动工具栏：选中文本后松开鼠标弹出 -->
    <u-floating-toolbar
      :container="editorWrapRef"
      :actions="aiActions"
      :loading="aiGenerating"
      :loading-text="t('ai.processing')"
      @action="handleAiAction"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { MdEditor, allToolbar, type ToolbarNames } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { useAiGenerate, type AiAction } from '@/composables/useAiGenerate'
import type { UFloatingToolbarAction } from '@u-blog/ui'

/** 有自定义工具栏时，在「保存」右侧插入索引 0，使 defToolbars 第一个按钮显示 */
const toolbars = computed((): ToolbarNames[] | undefined => {
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
    /** 初始内容（如从 IndexedDB 加载的草稿），仅当 content 仍为空时同步一次 */
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

/** 内部内容，仅在此组件内与 MdEditor 双向绑定，避免父级 draft 每次变化触发 setValue 导致光标丢失 */
const content = ref(props.initialContent || '')
/** 编辑器外层容器引用（用于 AI 浮动工具栏定位） */
const editorWrapRef = ref<HTMLElement | null>(null)
let syncFromInitialDone = false
let debounceTimer: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_MS = 250

// 仅当 initialContent 首次有值且 content 仍为空时同步（IndexedDB 异步加载完成后）
watch(
  () => props.initialContent,
  (val) => {
    if (syncFromInitialDone) return
    if (content.value === '' && val !== '') {
      content.value = val
      syncFromInitialDone = true
    }
  },
  { immediate: true }
)

watch(
  content,
  (val) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      emit('update:content', val)
      debounceTimer = null
    }, DEBOUNCE_MS)
  },
  { deep: false }
)

function onSave(_value?: string, _htmlPromise?: Promise<string>) {
  const value = content.value
  emit('update:content', value)
  emit('save', value)
}

/** 图片上传/粘贴：转为 base64 插入，保存文章时后端会替换为永久 URL */
function onUploadImg(files: File[], callback: (urls: string[]) => void) {
  const urls: string[] = []
  let done = 0
  const total = files.length
  if (total === 0) {
    callback([])
    return
  }
  files.forEach((file) => {
    const reader = new FileReader()
    reader.onload = () => {
      urls.push(reader.result as string)
      done += 1
      if (done === total) callback(urls)
    }
    reader.onerror = () => {
      done += 1
      if (done === total) callback(urls)
    }
    reader.readAsDataURL(file)
  })
}

/** 供父组件获取当前全文（如打开保存弹窗、快捷键保存前同步） */
function getContent(): string {
  return content.value
}

/** 供父组件设置编辑器内容（编辑模式加载已有文章） */
function setContent(val: string): void {
  content.value = val
  syncFromInitialDone = true
}

/** 立即将当前内容同步到父级（先 emit 再让父级 flush） */
function flushSync(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  emit('update:content', content.value)
}

/* ---------- AI 浮动工具栏处理 ---------- */
const { t } = useI18n()
const { generating: aiGenerating, generate: aiGenerate } = useAiGenerate()

/** 操作栏按钮列表——响应 i18n 语言切换 */
const aiActions = computed<UFloatingToolbarAction[]>(() => [
  { key: 'polish',    icon: 'fa-solid fa-wand-magic-sparkles', label: t('ai.polish') },
  { key: 'expand',    icon: 'fa-solid fa-expand',              label: t('ai.expand') },
  { key: 'condense',  icon: 'fa-solid fa-compress',            label: t('ai.condense') },
  { key: 'translate', icon: 'fa-solid fa-language',             label: t('ai.translate') },
  { key: 'continue',  icon: 'fa-solid fa-forward',             label: t('ai.continue') },
])

/**
 * 处理 AI 操作：接收选中文本 → 调用 AI 生成 → 替换原文
 * 替换策略：直接在 content 字符串中查找并替换选中文本
 */
async function handleAiAction(key: string, selectedText: string) {
  const result = await aiGenerate(key as AiAction, selectedText)
  if (!result) return

  // 在内容中查找并替换首次匹配的选中文本
  const idx = content.value.indexOf(selectedText)
  if (idx !== -1) {
    content.value =
      content.value.slice(0, idx) + result + content.value.slice(idx + selectedText.length)
  }
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
