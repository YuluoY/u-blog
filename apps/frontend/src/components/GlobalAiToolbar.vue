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
        :class="{ 'global-ai-toolbar--flipped': toolbarFlipped }"
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
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { UMessageFn } from '@u-blog/ui'
import { useAiGenerate, type AiAction } from '@/composables/useAiGenerate'
import { getSettings } from '@/api/settings'
import { SETTING_KEYS } from '@/constants/settings'
import { loadGuestAiConfig, hasGuestAiConfig, getActiveEntry } from '@/utils/guestCrypto'
import type { GuestAiConfig, GuestProviderEntry } from '@/utils/guestCrypto'
import { findProvider } from '@/constants/aiProviders'
import { encryptForTransport } from '@/utils/transportCrypto'
import { useUserStore } from '@/stores/model/user'

defineOptions({ name: 'GlobalAiToolbar' })

const { t } = useI18n()
const { generating: aiLoading, generate: aiGenerate } = useAiGenerate()
const userStore = useUserStore()

const HIDE_DELAY = 200
const MIN_SELECT_LEN = 1

/* ─── AI 模型配置检测（支持登录用户 + 游客本地配置） ─── */
const aiConfigured = ref(false)
/** 游客缓存的完整配置（运行时解密后保持在内存中） */
let guestConfig: GuestAiConfig | null = null
/** 游客当前激活厂商的有效条目（快速访问，避免每次查找） */
let guestActiveEntry: GuestProviderEntry | null = null
/** 游客当前激活厂商的 key */
let guestActiveProvider = ''

async function checkAiConfigured()
{
  // 登录用户：检查服务端配置
  if (userStore.isLoggedIn)
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
    guestConfig = null
    guestActiveEntry = null
    guestActiveProvider = ''
    return
  }

  // 游客：检查 localStorage 加密配置
  if (hasGuestAiConfig())
  {
    guestConfig = await loadGuestAiConfig()
    if (guestConfig)
    {
      guestActiveEntry = getActiveEntry(guestConfig)
      guestActiveProvider = guestConfig.activeProvider
      aiConfigured.value = !!guestActiveEntry
    }
    else
    {
      guestActiveEntry = null
      guestActiveProvider = ''
      aiConfigured.value = false
    }
  }
  else
  {
    guestConfig = null
    guestActiveEntry = null
    guestActiveProvider = ''
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
  { key: 'expand', icon: 'fa-solid fa-expand', label: t('ai.expand') },
  { key: 'continue', icon: 'fa-solid fa-forward', label: t('ai.continue') },
])

/* ─── 工具条可见性与定位 ─── */
const toolbarVisible = ref(false)
const toolbarPos = ref({ top: 0, left: 0 })
const toolbarFlipped = ref(false)
const selectedText = ref('')
let hideTimer: ReturnType<typeof setTimeout> | null = null

const toolbarStyle = computed(() => ({
  top: `${toolbarPos.value.top}px`,
  left: `${toolbarPos.value.left}px`,
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

/**
 * 计算 textarea/input 中选区的视口坐标
 * 通过镜像 div 测量选中文本在输入框内的精确位置
 */
function getInputSelectionRect(el: HTMLInputElement | HTMLTextAreaElement)
{
  const start = el.selectionStart ?? 0
  const end = el.selectionEnd ?? 0
  if (start === end) return null

  const cs = getComputedStyle(el)
  const mirror = document.createElement('div')
  const copyProps = [
    'font', 'letterSpacing', 'wordSpacing', 'textIndent', 'textTransform',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'boxSizing', 'lineHeight',
  ]
  for (const p of copyProps)
    (mirror.style as any)[p] = (cs as any)[p]

  Object.assign(mirror.style, {
    position: 'fixed',
    visibility: 'hidden',
    whiteSpace: el instanceof HTMLTextAreaElement ? 'pre-wrap' : 'pre',
    wordWrap: el instanceof HTMLTextAreaElement ? 'break-word' : 'normal',
    overflow: 'hidden',
    width: cs.width,
    top: '0',
    left: '0',
  })

  const span = document.createElement('span')
  span.textContent = el.value.substring(start, end) || '\u200b'
  mirror.append(
    document.createTextNode(el.value.substring(0, start)),
    span,
    document.createTextNode(el.value.substring(end)),
  )

  document.body.appendChild(mirror)
  mirror.scrollTop = el.scrollTop

  const elRect = el.getBoundingClientRect()
  const mirrorRect = mirror.getBoundingClientRect()
  const spanRect = span.getBoundingClientRect()
  document.body.removeChild(mirror)

  return {
    top: elRect.top + (spanRect.top - mirrorRect.top) - el.scrollTop,
    bottom: elRect.top + (spanRect.bottom - mirrorRect.top) - el.scrollTop,
    left: elRect.left + (spanRect.left - mirrorRect.left) - el.scrollLeft,
    width: spanRect.width,
  }
}

function handleMouseUp(e: MouseEvent)
{
  if (!aiConfigured.value || aiLoading.value) return

  const target = e.target as HTMLElement
  if (target.closest('.global-ai-toolbar'))
    return

  const activeEl = document.activeElement
  const inputEl = (activeEl instanceof HTMLTextAreaElement || activeEl instanceof HTMLInputElement)
    ? activeEl as HTMLInputElement | HTMLTextAreaElement
    : null

  if (inputEl && (inputEl instanceof HTMLTextAreaElement || isTextInput(inputEl as HTMLInputElement)))
  {
    const text = getInputSelection(inputEl)
    if (text.trim().length >= MIN_SELECT_LEN && !isInsideWriteEditor(inputEl))
    {
      // 通过镜像 div 精确测量选区位置，工具条居中显示在选区正上方
      const selRect = getInputSelectionRect(inputEl)
      const fallbackRect = inputEl.getBoundingClientRect()
      showToolbar(text, {
        top: (selRect ? selRect.top : fallbackRect.top) + window.scrollY - 8,
        left: (selRect ? selRect.left + selRect.width / 2 : fallbackRect.left + fallbackRect.width / 2) + window.scrollX,
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

  // 工具条居中显示在选区正上方
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
  toolbarFlipped.value = false
  toolbarVisible.value = true
  nextTick(adjustToolbarPosition)
}

/** 调整工具条位置，防止超出视口（上下左右） */
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

  // 顶部超出（工具条在选区上方，可能溢出顶部）——翻转到选区下方
  if (rect.top < MARGIN)
  {
    toolbarPos.value.top += rect.height + 24
    toolbarFlipped.value = true
  }

  // 底部超出（翻转后可能溢出底部）
  if (rect.bottom > window.innerHeight - MARGIN)
    toolbarPos.value.top -= rect.bottom - window.innerHeight + MARGIN
}

/** 选区变化监听：选区清空时延迟隐藏 */
function handleSelectionChange()
{
  if (aiLoading.value) return

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

/* ─── AI 操作处理（直接替换选中内容） ─── */

/** 替换选中文本（textarea/input 或 contenteditable） */
function replaceSelectedText(newText: string)
{
  if (savedInput)
  {
    try
    {
      savedInput.focus()
      savedInput.setSelectionRange(savedSelStart, savedSelEnd)
      document.execCommand('insertText', false, newText)
      UMessageFn({ message: t('ai.replaced'), type: 'success' })
    }
    catch
    {
      const before = savedInput.value.slice(0, savedSelStart)
      const after = savedInput.value.slice(savedSelEnd)
      savedInput.value = before + newText + after
      savedInput.dispatchEvent(new Event('input', { bubbles: true }))
      UMessageFn({ message: t('ai.replaced'), type: 'success' })
    }
    savedInput = null
    return
  }

  if (savedRange)
  {
    try
    {
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(savedRange)
      document.execCommand('insertText', false, newText)
      UMessageFn({ message: t('ai.replaced'), type: 'success' })
    }
    catch
    {
      UMessageFn({ message: t('ai.replaceFailed'), type: 'error' })
    }
    savedRange = null
  }
}

async function handleAction(key: string)
{
  if (!selectedText.value) return

  const text = selectedText.value
  // 工具条保持可见，模板自动切换为 loading 态（v-if="aiLoading"）

  // 游客使用本地配置（按厂商取对应的 API Key，加密传输到后端）
  let inlineConfig: { apiKey: string; baseUrl?: string; model?: string } | undefined
  if (!userStore.isLoggedIn && guestActiveEntry)
  {
    const p = findProvider(guestActiveProvider)
    inlineConfig = {
      apiKey: await encryptForTransport(guestActiveEntry.apiKey),
      baseUrl: guestActiveEntry.baseUrl ?? p?.baseUrl,
      model: guestActiveEntry.model,
    }
  }

  const result = await aiGenerate(key as AiAction, text, inlineConfig)

  // 隐藏工具条
  toolbarVisible.value = false
  selectedText.value = ''

  if (!result) return

  // 替换选中内容
  replaceSelectedText(result)
}

/* ─── 事件绑定生命周期 ─── */
onMounted(() =>
{
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('selectionchange', handleSelectionChange)
})

onBeforeUnmount(() =>
{
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('selectionchange', handleSelectionChange)
  clearHideTimer()
})
</script>

<style lang="scss">
/* ========== 全站 AI 浮动工具条（选区正上方弹出） ========== */
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

  /* 底部小三角（指向选区） */
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

  /* 翻转态：工具条在选区下方 */
  &--flipped {
    transform: translate(-50%, 0);

    &::after {
      bottom: auto;
      top: -6px;
      border-top: none;
      border-bottom: 6px solid var(--u-background-1, #fff);
      filter: drop-shadow(0 -1px 0 var(--u-border-2, #e0e0e0));
    }
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

.global-ai-toolbar--flipped.global-ai-toolbar-fade-enter-from,
.global-ai-toolbar--flipped.global-ai-toolbar-fade-leave-to {
  transform: translate(-50%, 0) translateY(-4px);
}

/* ---- 移动端适配 ---- */
@media (max-width: 480px) {
  .global-ai-toolbar {
    padding: 3px;
  }

  .global-ai-toolbar__btn span {
    display: none;
  }
}
</style>
