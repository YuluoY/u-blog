<!--
  GlobalAiToolbar — 全站 AI 浮动工具栏（仅限可输入区域）
  仅当用户在 可编辑 DOM（textarea / input / contenteditable）中选中文本时弹出。
  WriteView 自带独立工具栏，此组件自动跳过。
-->
<template>
  <Teleport to="body">
    <!-- AI 浮动工具条：仅在可编辑输入区域选中文本后弹出 -->
    <Transition name="global-ai-toolbar-fade">
      <div
        v-if="toolbarVisible"
        ref="toolbarRef"
        class="global-ai-toolbar"
        :style="toolbarStyle"
        @mousedown.prevent
      >
        <div v-if="aiLoading" class="global-ai-toolbar__loading">
          <u-icon icon="fa-solid fa-spinner" />
          <span>{{ t('ai.processing') }}</span>
        </div>
        <div v-else class="global-ai-toolbar__actions">
          <button
            v-for="act in aiActions"
            :key="act.key"
            class="global-ai-toolbar__btn"
            :title="act.label"
            @click="handleAction(act.key)"
          >
            <u-icon :icon="act.icon" />
            <span>{{ act.label }}</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- AI 结果浮动面板（AI 生成完成后展示） -->
    <Transition name="global-ai-result-fade">
      <div
        v-if="showResult"
        ref="resultPanelRef"
        class="global-ai-result"
        :style="resultStyle"
        @mousedown.prevent
      >
        <div class="global-ai-result__header">
          <span class="global-ai-result__title">
            <u-icon icon="fa-solid fa-wand-magic-sparkles" />
            {{ resultActionLabel }}
          </span>
          <button class="global-ai-result__close" @click="closeResult" :aria-label="t('common.close')">
            <u-icon icon="fa-solid fa-xmark" />
          </button>
        </div>
        <div class="global-ai-result__body">
          <div class="global-ai-result__text">{{ resultText }}</div>
        </div>
        <div class="global-ai-result__footer">
          <button class="global-ai-result__btn" @click="copyResult">
            <u-icon icon="fa-solid fa-copy" />
            <span>{{ t('ai.copyResult') }}</span>
          </button>
          <button class="global-ai-result__btn global-ai-result__btn--primary" @click="replaceAndClose">
            <u-icon icon="fa-solid fa-arrow-right-arrow-left" />
            <span>{{ t('ai.replaceText') }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { UMessageFn } from '@u-blog/ui'
import { useAiGenerate, type AiAction } from '@/composables/useAiGenerate'
import { getSettings } from '@/api/settings'
import { SETTING_KEYS } from '@/constants/settings'

defineOptions({ name: 'GlobalAiToolbar' })

const { t } = useI18n()
const { generating: aiLoading, generate: aiGenerate } = useAiGenerate()

const HIDE_DELAY = 200
const MIN_SELECT_LEN = 1

/* ─── AI 模型配置检测 ─── */
const aiConfigured = ref(false)

async function checkAiConfigured()
{
  try
  {
    const data = await getSettings([SETTING_KEYS.OPENAI_API_KEY])
    const item = data[SETTING_KEYS.OPENAI_API_KEY]
    aiConfigured.value = !!(item?.masked || (item?.value && String(item.value).trim()))
  }
  catch
  {
    aiConfigured.value = false
  }
}

onMounted(checkAiConfigured)

function onSettingsSaved()
{
  checkAiConfigured()
}
onMounted(() => window.addEventListener('u-blog:settings-saved', onSettingsSaved))
onBeforeUnmount(() => window.removeEventListener('u-blog:settings-saved', onSettingsSaved))

/* ─── 操作按钮列表 ─── */
interface ActionItem { key: string; icon: string; label: string }

const aiActions = computed<ActionItem[]>(() => [
  { key: 'translate', icon: 'fa-solid fa-language', label: t('ai.translate') },
  { key: 'explain', icon: 'fa-solid fa-lightbulb', label: t('ai.explain') },
  { key: 'polish', icon: 'fa-solid fa-wand-magic-sparkles', label: t('ai.polish') },
  { key: 'condense', icon: 'fa-solid fa-compress', label: t('ai.condense') },
])

/* ─── 工具条可见性与定位 ─── */
const toolbarVisible = ref(false)
const toolbarPos = ref({ top: 0, left: 0 })
const selectedText = ref('')
let hideTimer: ReturnType<typeof setTimeout> | null = null

const toolbarStyle = computed(() => ({
  top: `${toolbarPos.value.top}px`,
  left: `${toolbarPos.value.left}px`,
}))

/* ─── 结果面板状态 ─── */
const showResult = ref(false)
const resultText = ref('')
const resultActionLabel = ref('')
const resultPos = ref({ top: 0, left: 0 })
const resultPanelRef = ref<HTMLElement | null>(null)

const resultStyle = computed(() => ({
  top: `${resultPos.value.top}px`,
  left: `${resultPos.value.left}px`,
}))

/** 记录选中时的上下文，用于替换 */
let savedRange: Range | null = null
let savedInput: HTMLInputElement | HTMLTextAreaElement | null = null
let savedSelStart = 0
let savedSelEnd = 0

/* ─── 可编辑元素检测 ─── */

/** 判断节点是否位于可编辑 DOM 内 */
function isInEditableContext(node: Node | null): boolean
{
  if (!node) return false
  let el: Node | null = node
  while (el)
  {
    if (el instanceof HTMLElement)
    {
      if (el.isContentEditable) return true
      const tag = el.tagName
      if (tag === 'TEXTAREA' || (tag === 'INPUT' && isTextInput(el as HTMLInputElement)))
        return true
    }
    el = el.parentNode
  }
  return false
}

/** 找到最近的 textarea/input 祖先（如果有） */
function findInputAncestor(node: Node | null): HTMLInputElement | HTMLTextAreaElement | null
{
  let el: Node | null = node
  while (el)
  {
    if (el instanceof HTMLTextAreaElement) return el
    if (el instanceof HTMLInputElement && isTextInput(el)) return el
    el = el.parentNode
  }
  return null
}

function isTextInput(el: HTMLInputElement): boolean
{
  const t = el.type?.toLowerCase()
  return !t || t === 'text' || t === 'search' || t === 'url' || t === 'email'
}

/** 检查选区是否在 WriteEditor 内部 */
function isInsideWriteEditor(node: Node | null): boolean
{
  if (!node) return false
  let el: Node | null = node
  while (el)
  {
    if (el instanceof HTMLElement && el.classList.contains('write-editor-wrap'))
      return true
    el = el.parentNode
  }
  return false
}

/* ─── 选区检测：仅在可编辑区域触发 ─── */

/**
 * 从 textarea / input 获取选中文本
 * （这些元素的选区不反映在 window.getSelection() 中）
 */
function getInputSelection(el: HTMLInputElement | HTMLTextAreaElement): string
{
  const start = el.selectionStart ?? 0
  const end = el.selectionEnd ?? 0
  if (start === end) return ''
  return el.value.slice(start, end)
}

function handleMouseUp(e: MouseEvent)
{
  if (!aiConfigured.value || aiLoading.value) return

  // 判断事件目标是否在 toolbar/result 面板内——如果是，不处理
  const target = e.target as HTMLElement
  if (target.closest('.global-ai-toolbar') || target.closest('.global-ai-result'))
    return

  // 优先检查 textarea / input 选区
  const activeEl = document.activeElement
  const inputEl = (activeEl instanceof HTMLTextAreaElement || activeEl instanceof HTMLInputElement)
    ? activeEl as HTMLInputElement | HTMLTextAreaElement
    : null

  if (inputEl && (inputEl instanceof HTMLTextAreaElement || isTextInput(inputEl as HTMLInputElement)))
  {
    const text = getInputSelection(inputEl)
    if (text.trim().length >= MIN_SELECT_LEN && !isInsideWriteEditor(inputEl))
    {
      // 用鼠标松开位置定位工具条，使其贴近实际选中文本
      showToolbar(text, {
        top: e.clientY + window.scrollY - 8,
        left: e.clientX + window.scrollX,
      })
      savedInput = inputEl
      savedSelStart = inputEl.selectionStart ?? 0
      savedSelEnd = inputEl.selectionEnd ?? 0
      savedRange = null
      return
    }
  }

  // 检查 contenteditable 中的选区
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) return

  const text = selection.toString().trim()
  if (text.length < MIN_SELECT_LEN) return

  const anchorNode = selection.anchorNode
  if (!isInEditableContext(anchorNode)) return
  if (isInsideWriteEditor(anchorNode)) return

  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()

  showToolbar(text, {
    top: rect.top + window.scrollY - 8,
    left: rect.left + window.scrollX + rect.width / 2,
  })
  savedRange = range.cloneRange()
  savedInput = null
}

const toolbarRef = ref<HTMLElement | null>(null)

function showToolbar(text: string, pos: { top: number; left: number })
{
  clearHideTimer()
  selectedText.value = text
  toolbarPos.value = pos
  toolbarVisible.value = true
  nextTick(adjustToolbarPosition)
}

/** 调整工具条位置，防止超出视口 */
function adjustToolbarPosition()
{
  const el = toolbarRef.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  const vw = window.innerWidth
  const MARGIN = 8

  // 左侧超出
  if (rect.left < MARGIN)
    toolbarPos.value.left += MARGIN - rect.left

  // 右侧超出
  if (rect.right > vw - MARGIN)
    toolbarPos.value.left -= rect.right - vw + MARGIN

  // 顶部超出（工具条在选区上方，可能溢出顶部）
  if (rect.top < MARGIN)
    toolbarPos.value.top += rect.height + 16 // 翻转到下方
}

/** 选区变化监听：选区清空时延迟隐藏 */
function handleSelectionChange()
{
  if (aiLoading.value || showResult.value) return

  // 检查 contenteditable 选区
  const selection = window.getSelection()
  const hasContentEditableSelection = selection && !selection.isCollapsed && selection.toString().trim().length > 0

  // 检查 input/textarea 选区
  const activeEl = document.activeElement
  let hasInputSelection = false
  if (activeEl instanceof HTMLTextAreaElement || activeEl instanceof HTMLInputElement)
  {
    const text = getInputSelection(activeEl as HTMLInputElement | HTMLTextAreaElement)
    hasInputSelection = text.trim().length > 0
  }

  if (!hasContentEditableSelection && !hasInputSelection)
    scheduleHide()
}

function scheduleHide()
{
  clearHideTimer()
  hideTimer = setTimeout(() =>
  {
    toolbarVisible.value = false
    selectedText.value = ''
  }, HIDE_DELAY)
}

function clearHideTimer()
{
  if (hideTimer)
  {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

/* ─── AI 操作处理 ─── */

async function handleAction(key: string)
{
  if (!selectedText.value) return

  const text = selectedText.value
  // 隐藏工具条，但保持 selectedText 以便后续替换
  toolbarVisible.value = false

  const actionLabels: Record<string, () => string> = {
    translate: () => t('ai.translate'),
    explain: () => t('ai.explain'),
    polish: () => t('ai.polish'),
    condense: () => t('ai.condense'),
  }
  resultActionLabel.value = actionLabels[key]?.() ?? key

  // 记录结果面板位置（选区下方）
  resultPos.value = {
    top: toolbarPos.value.top + 40,
    left: toolbarPos.value.left,
  }

  const result = await aiGenerate(key as AiAction, text)
  if (!result) return

  resultText.value = result
  showResult.value = true
  await nextTick()
  adjustResultPanelPosition()
}

/** 调整结果面板位置，防止超出视口 */
function adjustResultPanelPosition()
{
  const panel = resultPanelRef.value
  if (!panel) return

  const rect = panel.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  if (rect.right > vw - 16)
    resultPos.value.left -= rect.right - vw + 16

  if (rect.left < 16)
    resultPos.value.left += 16 - rect.left

  if (rect.bottom > vh - 16)
    resultPos.value.top -= rect.height + 56
}

/** 复制结果到剪贴板 */
async function copyResult()
{
  try
  {
    await navigator.clipboard.writeText(resultText.value)
    UMessageFn({ message: t('ai.copiedToClipboard'), type: 'success' })
  }
  catch
  {
    UMessageFn({ message: t('ai.copyFailed'), type: 'error' })
  }
}

/** 替换原文并关闭结果面板 */
function replaceAndClose()
{
  // textarea / input 替换
  if (savedInput)
  {
    try
    {
      savedInput.focus()
      savedInput.setSelectionRange(savedSelStart, savedSelEnd)
      document.execCommand('insertText', false, resultText.value)
      UMessageFn({ message: t('ai.replaced'), type: 'success' })
    }
    catch
    {
      // 回退方案：直接修改 value
      const before = savedInput.value.slice(0, savedSelStart)
      const after = savedInput.value.slice(savedSelEnd)
      savedInput.value = before + resultText.value + after
      savedInput.dispatchEvent(new Event('input', { bubbles: true }))
      UMessageFn({ message: t('ai.replaced'), type: 'success' })
    }
    closeResult()
    return
  }

  // contenteditable 替换
  if (savedRange)
  {
    try
    {
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(savedRange)
      document.execCommand('insertText', false, resultText.value)
      UMessageFn({ message: t('ai.replaced'), type: 'success' })
    }
    catch
    {
      UMessageFn({ message: t('ai.replaceFailed'), type: 'error' })
    }
  }
  closeResult()
}

/** 关闭结果面板 */
function closeResult()
{
  showResult.value = false
  resultText.value = ''
  savedRange = null
  savedInput = null
}

/** 点击面板外关闭 */
function handleDocClick(e: MouseEvent)
{
  const target = e.target as HTMLElement
  if (target.closest('.global-ai-result') || target.closest('.global-ai-toolbar'))
    return

  if (showResult.value) closeResult()
}

/* ─── 事件绑定生命周期 ─── */
onMounted(() =>
{
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('selectionchange', handleSelectionChange)
  document.addEventListener('mousedown', handleDocClick)
})

onBeforeUnmount(() =>
{
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('selectionchange', handleSelectionChange)
  document.removeEventListener('mousedown', handleDocClick)
  clearHideTimer()
})
</script>

<style lang="scss">
/* ========== 全站 AI 浮动工具条 ========== */
.global-ai-toolbar {
  position: absolute;
  z-index: 10010;
  transform: translate(-50%, -100%);
  pointer-events: auto;
  display: flex;
  align-items: center;
  background: var(--u-background-1, #fff);
  border: 1px solid var(--u-border-2, #e0e0e0);
  border-radius: 8px;
  box-shadow: var(--u-shadow-3, 0 4px 16px rgba(0, 0, 0, 0.1));
  padding: 4px;
  gap: 2px;

  /* 底部小三角 */
  &::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid var(--u-background-1, #fff);
    filter: drop-shadow(0 1px 0 var(--u-border-2, #e0e0e0));
  }

  &__loading {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    font-size: 12px;
    color: var(--u-text-3, #999);
    white-space: nowrap;

    .u-icon {
      animation: global-ai-spin 1s linear infinite;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 10px;
    font-size: 12px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--u-text-2, #666);
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s;

    &:hover {
      background: var(--u-primary-light-8, rgba(64, 158, 255, 0.1));
      color: var(--u-primary, #409eff);
    }
  }
}

@keyframes global-ai-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ---- 工具条淡入淡出 ---- */
.global-ai-toolbar-fade-enter-active,
.global-ai-toolbar-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.global-ai-toolbar-fade-enter-from,
.global-ai-toolbar-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -100%) translateY(4px);
}

/* ========== AI 结果浮动面板 ========== */
.global-ai-result {
  position: absolute;
  z-index: 10010;
  transform: translateX(-50%);
  width: 360px;
  max-width: calc(100vw - 32px);
  max-height: 50vh;
  display: flex;
  flex-direction: column;
  background: var(--u-background-1, #fff);
  border: 1px solid var(--u-border-2, #e0e0e0);
  border-radius: 12px;
  box-shadow: var(--u-shadow-3, 0 4px 16px rgba(0, 0, 0, 0.12));
  overflow: hidden;
  pointer-events: auto;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--u-border-1, #f0f0f0);
    flex-shrink: 0;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--u-text-1, #333);
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: var(--u-text-3, #999);
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    &:hover {
      background: var(--u-background-3, #f5f5f5);
      color: var(--u-text-1, #333);
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 12px 14px;
  }

  &__text {
    font-size: 14px;
    line-height: 1.7;
    color: var(--u-text-1, #333);
    white-space: pre-wrap;
    word-break: break-word;
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-top: 1px solid var(--u-border-1, #f0f0f0);
    flex-shrink: 0;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px;
    font-size: 12px;
    border: 1px solid var(--u-border-2, #e0e0e0);
    border-radius: 6px;
    background: var(--u-background-1, #fff);
    color: var(--u-text-2, #666);
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s;

    &:hover {
      background: var(--u-background-3, #f5f5f5);
      border-color: var(--u-border-3, #ccc);
      color: var(--u-text-1, #333);
    }

    &--primary {
      background: var(--u-primary, #409eff);
      border-color: var(--u-primary, #409eff);
      color: #fff;

      &:hover {
        background: var(--u-primary-light-2, #66b1ff);
        border-color: var(--u-primary-light-2, #66b1ff);
        color: #fff;
      }
    }
  }
}

/* ---- 结果面板过渡 ---- */
.global-ai-result-fade-enter-active,
.global-ai-result-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.global-ai-result-fade-enter-from,
.global-ai-result-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px);
}

/* ---- 移动端适配 ---- */
@media (max-width: 480px) {
  .global-ai-toolbar {
    padding: 3px;
  }

  .global-ai-toolbar__btn span {
    display: none;
  }

  .global-ai-result {
    width: calc(100vw - 32px);
    left: 16px !important;
    transform: none;
  }
}
</style>
