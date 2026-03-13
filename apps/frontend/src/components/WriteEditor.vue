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
      ref="floatingToolbarRef"
      :container="editorWrapRef"
      :actions="aiActions"
      :loading="phase === 'loading'"
      :loading-text="t('ai.processing')"
      @action="handleAiAction"
    />

    <!-- 自定义指令输入浮动框 -->
    <Teleport to="body">
      <Transition name="write-ai-custom-fade">
        <div
          v-if="phase === 'custom-input'"
          ref="customPopupRef"
          class="write-ai-custom-popup"
          :style="customPopupStyle"
          @mousedown.prevent
        >
          <input
            ref="customInputRef"
            v-model="customPrompt"
            class="write-ai-custom-popup__input"
            :placeholder="t('ai.customPlaceholder')"
            @keydown.enter.prevent="handleCustomSend"
            @keydown.escape.prevent="closeCustomInput"
            @mousedown.stop
          />
          <button class="write-ai-custom-popup__btn write-ai-custom-popup__btn--primary" :disabled="!customPrompt.trim()" @click="handleCustomSend">
            <u-icon icon="fa-solid fa-paper-plane" />
          </button>
          <button class="write-ai-custom-popup__btn" @click="closeCustomInput">
            <u-icon icon="fa-solid fa-xmark" />
          </button>
        </div>
      </Transition>
    </Teleport>

    <!-- AI 结果预览弹窗（UDialog，自带拖拽 + 缩放） -->
    <u-dialog
      v-model="previewVisible"
      :title="previewTitle"
      :width="dialogWidth"
      :height="dialogHeight"
      :z-index="10011"
      @cancel="handleDiscard"
      @resize="onDialogResize"
    >
      <div class="write-ai-preview__content">{{ aiResult }}</div>

      <template #footer>
        <div class="write-ai-preview__footer">
          <div class="write-ai-preview__actions-left">
            <button class="write-ai-preview__btn write-ai-preview__btn--primary" @click="handleReplace">
              <u-icon icon="fa-solid fa-check" />
              <span>{{ t('ai.replaceText') }}</span>
            </button>
            <button class="write-ai-preview__btn" @click="handleInsertAfter">
              <u-icon icon="fa-solid fa-plus" />
              <span>{{ t('ai.insertAfter') }}</span>
            </button>
            <button class="write-ai-preview__btn" @click="handleCopy">
              <u-icon icon="fa-solid fa-copy" />
              <span>{{ t('ai.copyResult') }}</span>
            </button>
          </div>
          <div class="write-ai-preview__actions-right">
            <button class="write-ai-preview__btn" @click="handleRetry">
              <u-icon icon="fa-solid fa-rotate" />
              <span>{{ t('ai.retry') }}</span>
            </button>
            <button class="write-ai-preview__btn" @click="handleDiscard">
              <u-icon icon="fa-solid fa-xmark" />
              <span>{{ t('ai.discard') }}</span>
            </button>
          </div>
        </div>
      </template>
    </u-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { MdEditor, allToolbar, type ToolbarNames } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { useAiGenerate, type AiAction } from '@/composables/useAiGenerate'
import type { UFloatingToolbarAction } from '@u-blog/ui'
import { UMessageFn } from '@u-blog/ui'

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
const floatingToolbarRef = ref<InstanceType<any> | null>(null)
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

/* ========== AI 浮动工具栏 + 预览弹窗 ========== */
const { t } = useI18n()
const { generating: aiGenerating, generate: aiGenerate } = useAiGenerate()

type EditorAiPhase = 'idle' | 'custom-input' | 'loading' | 'preview'
const phase = ref<EditorAiPhase>('idle')
const aiResult = ref('')
const lastAction = ref<string>('')
const lastSelectedText = ref('')

/* ─── 自定义指令 ─── */
const customPrompt = ref('')
const customInputRef = ref<HTMLInputElement | null>(null)
const customPopupRef = ref<HTMLElement | null>(null)
const customPopupPos = ref({ top: 0, left: 0 })
const customPopupStyle = computed(() => ({
  top: `${customPopupPos.value.top}px`,
  left: `${customPopupPos.value.left}px`,
}))

/* ─── 结果弹窗宽高缓存 ─── */
const AI_DIALOG_SIZE_KEY = 'write-ai-dialog-size'
function loadDialogSize(): { w: number; h: number }
{
  try
  {
    const raw = localStorage.getItem(AI_DIALOG_SIZE_KEY)
    if (raw)
    {
      const parsed = JSON.parse(raw)
      if (parsed.w > 0 && parsed.h > 0) return parsed
    }
  }
  catch
  { /* ignore */ }
  return { w: 480, h: 320 }
}
const cachedSize = loadDialogSize()
const dialogWidth = ref(cachedSize.w)
const dialogHeight = ref(cachedSize.h)

function onDialogResize(width: number, height: number)
{
  dialogWidth.value = width
  dialogHeight.value = height
  localStorage.setItem(AI_DIALOG_SIZE_KEY, JSON.stringify({ w: width, h: height }))
}

/* ─── 弹窗可见性 ─── */
const previewVisible = computed({
  get: () => phase.value === 'preview',
  set: (val: boolean) =>
  {
    if (!val) handleDiscard()
  },
})

const actionLabels: Record<string, () => string> = {
  polish: () => t('ai.polish'),
  expand: () => t('ai.expand'),
  condense: () => t('ai.condense'),
  translate: () => t('ai.translate'),
  continue: () => t('ai.continue'),
  custom: () => t('ai.custom'),
}

const previewTitle = computed(() =>
{
  const label = actionLabels[lastAction.value]?.() ?? lastAction.value
  return t('ai.previewTitle', { action: label })
})

/* ─── 操作栏按钮 ─── */
const aiActions = computed<UFloatingToolbarAction[]>(() => [
  { key: 'translate', icon: 'fa-solid fa-language', label: t('ai.translate') },
  { key: 'polish', icon: 'fa-solid fa-wand-magic-sparkles', label: t('ai.polish') },
  { key: 'condense', icon: 'fa-solid fa-compress', label: t('ai.condense') },
  { key: 'expand', icon: 'fa-solid fa-expand', label: t('ai.expand') },
  { key: 'continue', icon: 'fa-solid fa-forward', label: t('ai.continue') },
  { key: 'custom', icon: 'fa-solid fa-pen-nib', label: t('ai.custom') },
])

/* ─── 操作分发 ─── */
async function handleAiAction(key: string, selectedText: string)
{
  lastSelectedText.value = selectedText
  lastAction.value = key

  if (key === 'custom')
  {
    showCustomInput()
    return
  }

  await executeAiAction(key, selectedText)
}

function showCustomInput()
{
  // 基于当前选区位置计算弹出位置
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) return

  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()

  customPopupPos.value = {
    top: rect.bottom + window.scrollY + 8,
    left: rect.left + window.scrollX + rect.width / 2,
  }

  phase.value = 'custom-input'
  customPrompt.value = ''
  nextTick(() =>
  {
    adjustCustomPopupPosition()
    customInputRef.value?.focus()
  })
}

/** 自定义输入弹出框可视区边界调整 */
function adjustCustomPopupPosition()
{
  const el = customPopupRef.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const MARGIN = 8

  // 左侧超出
  if (rect.left < MARGIN)
    customPopupPos.value.left += MARGIN - rect.left

  // 右侧超出
  if (rect.right > vw - MARGIN)
    customPopupPos.value.left -= rect.right - vw + MARGIN

  // 底部超出 → 移到选区上方
  if (rect.bottom > vh - MARGIN)
  {
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed)
    {
      const selRect = selection.getRangeAt(0).getBoundingClientRect()
      customPopupPos.value.top = selRect.top + window.scrollY - rect.height - 8
    }
  }

  // 顶部超出
  if (rect.top < MARGIN)
    customPopupPos.value.top = MARGIN + window.scrollY
}

function closeCustomInput()
{
  phase.value = 'idle'
  customPrompt.value = ''
}

async function handleCustomSend()
{
  const prompt = customPrompt.value.trim()
  if (!prompt || !lastSelectedText.value) return
  await executeAiAction('custom', lastSelectedText.value, prompt)
}

/* ─── AI 生成执行 ─── */
async function executeAiAction(action: string, text: string, prompt?: string)
{
  phase.value = 'loading'
  // 隐藏浮动工具栏
  floatingToolbarRef.value?.hide?.()

  const result = await aiGenerate(
    action as AiAction,
    text,
    undefined,
    prompt,
  )

  if (!result)
  {
    phase.value = 'idle'
    return
  }

  aiResult.value = result
  phase.value = 'preview'
}

/* ─── 预览操作 ─── */
function handleReplace()
{
  if (!aiResult.value || !lastSelectedText.value) return

  const idx = content.value.indexOf(lastSelectedText.value)
  if (idx !== -1)
  {
    content.value =
      content.value.slice(0, idx) + aiResult.value + content.value.slice(idx + lastSelectedText.value.length)
    UMessageFn({ message: t('ai.replaced'), type: 'success' })
  }
  else
    UMessageFn({ message: t('ai.replaceFailed'), type: 'warning' })
  resetAiState()
}

function handleInsertAfter()
{
  if (!aiResult.value || !lastSelectedText.value) return

  const idx = content.value.indexOf(lastSelectedText.value)
  if (idx !== -1)
  {
    const insertPos = idx + lastSelectedText.value.length
    content.value =
      content.value.slice(0, insertPos) + '\n' + aiResult.value + content.value.slice(insertPos)
    UMessageFn({ message: t('ai.inserted'), type: 'success' })
  }
  resetAiState()
}

async function handleCopy()
{
  try
  {
    await navigator.clipboard.writeText(aiResult.value)
    UMessageFn({ message: t('ai.copiedToClipboard'), type: 'success' })
  }
  catch
  {
    UMessageFn({ message: t('ai.copyFailed'), type: 'error' })
  }
}

async function handleRetry()
{
  if (!lastSelectedText.value || !lastAction.value) return
  const prompt = lastAction.value === 'custom' ? customPrompt.value.trim() : undefined
  await executeAiAction(lastAction.value, lastSelectedText.value, prompt)
}

function handleDiscard()
{
  resetAiState()
}

function resetAiState()
{
  phase.value = 'idle'
  aiResult.value = ''
  lastSelectedText.value = ''
  lastAction.value = ''
}

defineExpose({
  getContent,
  setContent,
  flushSync
})
</script>

<style lang="scss" scoped>
/* ─── 自定义指令弹出框 ─── */
.write-ai-custom-popup {
  position: absolute;
  z-index: 10010;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  background: var(--u-background-1, #fff);
  border: 1px solid var(--u-border-2, #e0e0e0);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateX(-50%);

  &__input {
    width: 240px;
    padding: 6px 10px;
    font-size: 13px;
    border: 1px solid var(--u-border-2, #e0e0e0);
    border-radius: 6px;
    outline: none;
    background: var(--u-background-1, #fff);
    color: var(--u-text-1, #333);
    transition: border-color 0.15s;

    &:focus {
      border-color: var(--u-primary, #409eff);
    }
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border: 1px solid var(--u-border-2, #e0e0e0);
    border-radius: 6px;
    background: var(--u-background-1, #fff);
    color: var(--u-text-2, #666);
    font-size: 12px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;

    &:hover {
      border-color: var(--u-primary, #409eff);
      color: var(--u-primary, #409eff);
    }

    &--primary {
      background: var(--u-primary, #409eff);
      border-color: var(--u-primary, #409eff);
      color: #fff;

      &:hover {
        background: var(--u-primary-dark-2, #337ecc);
        border-color: var(--u-primary-dark-2, #337ecc);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}

.write-ai-custom-fade-enter-active,
.write-ai-custom-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.write-ai-custom-fade-enter-from,
.write-ai-custom-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px);
}
</style>

<style lang="scss">
/* ─── UDialog 内的预览内容样式（非 scoped，UDialog teleport 到 body） ─── */
.write-ai-preview__content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--u-text-1, #333);
  white-space: pre-wrap;
  word-break: break-word;
}

.write-ai-preview__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
}

.write-ai-preview__actions-left,
.write-ai-preview__actions-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.write-ai-preview__btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  font-size: 12px;
  border: 1px solid var(--u-border-2, #e0e0e0);
  border-radius: 6px;
  background: var(--u-background-1, #fff);
  color: var(--u-text-2, #666);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s, border-color 0.15s;

  &:hover {
    border-color: var(--u-primary, #409eff);
    color: var(--u-primary, #409eff);
    background: var(--u-primary-light-8, rgba(64, 158, 255, 0.05));
  }

  &--primary {
    background: var(--u-primary, #409eff);
    border-color: var(--u-primary, #409eff);
    color: #fff;

    &:hover {
      background: var(--u-primary-dark-2, #337ecc);
      border-color: var(--u-primary-dark-2, #337ecc);
      color: #fff;
    }
  }
}
</style>

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
