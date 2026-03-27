<!--
  GlobalAiToolbar — 全站 AI 浮动工具栏（仅限可输入区域）
  仅当用户在 可编辑 DOM（textarea / input / contenteditable）中选中文本时弹出。
  支持多轮对话：首次生成后可在弹窗内继续追问，SSE 流式输出，可中断。
  阶段：actions → custom-input / loading → preview（可拖拽/缩放/全屏）
-->
<template>
  <Teleport to="body">
    <!-- 阶段 1/2：工具条 + 自定义输入 + Loading -->
    <Transition name="global-ai-toolbar-fade">
      <div
        v-if="toolbarVisible && phase !== 'preview'"
        ref="toolbarRef"
        class="global-ai-toolbar"
        :class="{ 'global-ai-toolbar--flipped': toolbarFlipped }"
        :style="toolbarStyle"
        @mousedown.prevent
      >
        <!-- Loading 态 -->
        <div v-if="phase === 'loading'" class="global-ai-toolbar__loading">
          <u-icon icon="fa-solid fa-spinner" />
          <span>{{ t('ai.processing') }}</span>
          <button class="global-ai-toolbar__btn global-ai-toolbar__btn--stop" @click="handleAbort">
            <u-icon icon="fa-solid fa-stop" />
          </button>
        </div>

        <!-- 自定义指令输入态 -->
        <div v-else-if="phase === 'custom-input'" class="global-ai-toolbar__custom">
          <input
            ref="customInputRef"
            v-model="customPrompt"
            class="global-ai-toolbar__input"
            :placeholder="t('ai.customPlaceholder')"
            @mousedown.stop
          />
          <button class="global-ai-toolbar__btn global-ai-toolbar__btn--primary" :disabled="!customPrompt.trim()" @click="handleCustomSend">
            <u-icon icon="fa-solid fa-paper-plane" />
          </button>
          <button class="global-ai-toolbar__btn" @click="phase = 'actions'">
            <u-icon icon="fa-solid fa-arrow-left" />
          </button>
        </div>

        <!-- 默认操作按钮列表 -->
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

    <!-- 阶段 3：结果预览弹窗（使用 UDialog，自带拖拽 + 缩放） -->
    <u-dialog
      ref="dialogRef"
      v-model="previewVisible"
      :title="previewTitle"
      :width="currentDialogWidth"
      :height="currentDialogHeight"
      :z-index="10011"
      @cancel="handleDiscard"
      @resize="onDialogResize"
    >
      <!-- 对话消息列表 -->
      <div ref="chatBodyRef" class="global-ai-chat" :class="{ 'global-ai-chat--fullscreen': isFullscreen }">
        <div
          v-for="(msg, idx) in chatMessages"
          :key="idx"
          class="global-ai-chat__msg"
          :class="`global-ai-chat__msg--${msg.role}`"
        >
          <div class="global-ai-chat__bubble">
            <span v-if="msg.role === 'assistant'" v-html="renderMarkdown(msg.content)" />
            <span v-else>{{ msg.content }}</span>
          </div>
        </div>
        <!-- 流式输出中的实时内容 -->
        <div v-if="streamingText" class="global-ai-chat__msg global-ai-chat__msg--assistant">
          <div class="global-ai-chat__bubble">
            <span v-html="renderMarkdown(streamingText)" />
            <span class="global-ai-chat__cursor" />
          </div>
        </div>
        <!-- 正在等待响应（无内容时） -->
        <div v-else-if="chatLoading" class="global-ai-chat__msg global-ai-chat__msg--assistant">
          <div class="global-ai-chat__bubble global-ai-chat__bubble--loading">
            <u-icon icon="fa-solid fa-spinner" />
            <span>{{ t('ai.processing') }}</span>
          </div>
        </div>
      </div>

      <!-- 追问输入区 -->
      <div class="global-ai-chat__input-row">
        <textarea
          ref="followUpInputRef"
          v-model="followUpText"
          class="global-ai-chat__input"
          :placeholder="t('ai.followUpPlaceholder')"
          :disabled="chatLoading"
          rows="1"
          @keydown="handleFollowUpKeydown"
          @input="autoResizeTextarea"
        />
        <!-- 发送 / 停止按钮 -->
        <button
          v-if="chatLoading"
          class="global-ai-chat__send global-ai-chat__send--stop"
          :title="t('ai.stop')"
          @click="handleAbort"
        >
          <u-icon icon="fa-solid fa-stop" />
        </button>
        <button
          v-else
          class="global-ai-chat__send"
          :disabled="!followUpText.trim()"
          @click="handleFollowUp"
        >
          <u-icon icon="fa-solid fa-paper-plane" />
        </button>
      </div>

      <!-- 底部操作按钮 -->
      <template #footer>
        <div class="global-ai-preview__footer">
          <div class="global-ai-preview__actions-left">
            <button class="global-ai-preview__btn global-ai-preview__btn--primary" @click="handleReplace">
              <u-icon icon="fa-solid fa-check" />
              <span>{{ t('ai.replaceText') }}</span>
            </button>
            <button class="global-ai-preview__btn" @click="handleInsertAfter">
              <u-icon icon="fa-solid fa-plus" />
              <span>{{ t('ai.insertAfter') }}</span>
            </button>
            <button class="global-ai-preview__btn" @click="handleCopy">
              <u-icon icon="fa-solid fa-copy" />
              <span>{{ t('ai.copyResult') }}</span>
            </button>
          </div>
          <div class="global-ai-preview__actions-right">
            <button class="global-ai-preview__btn" :title="isFullscreen ? t('ai.exitFullscreen') : t('ai.fullscreen')" @click="toggleFullscreen">
              <u-icon :icon="isFullscreen ? 'fa-solid fa-compress' : 'fa-solid fa-expand'" />
            </button>
            <button class="global-ai-preview__btn" @click="handleDiscard">
              <u-icon icon="fa-solid fa-xmark" />
              <span>{{ t('ai.discard') }}</span>
            </button>
          </div>
        </div>
      </template>
    </u-dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { UMessageFn } from '@u-blog/ui'
import { useAiGenerate, type AiAction } from '@/composables/useAiGenerate'
import { sendChatMessageStream, type ChatMessagePayload } from '@/api/chat'
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

/* ─── 简单文本渲染（转义 HTML + 换行 + 代码块） ─── */
function renderMarkdown(text: string): string
{
  // 转义 HTML 特殊字符，防止 XSS
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  // 简单代码块（```...```）
  const withCodeBlocks = escaped.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    '<pre><code>$2</code></pre>',
  )

  // 内联代码（`...`）
  const withInlineCode = withCodeBlocks.replace(
    /`([^`]+)`/g,
    '<code>$1</code>',
  )

  // 换行
  return withInlineCode.replace(/\n/g, '<br>')
}

/* ─── 阶段状态机 ─── */
type ToolbarPhase = 'actions' | 'custom-input' | 'loading' | 'preview'
const phase = ref<ToolbarPhase>('actions')
const aiResult = ref('')
const lastAction = ref<string>('')
const customPrompt = ref('')
const customInputRef = ref<HTMLInputElement | null>(null)

/* ─── 对话消息与追问 ─── */
interface ChatMsg { role: 'user' | 'assistant'; content: string }
const chatMessages = ref<ChatMsg[]>([])
const chatLoading = ref(false)
const streamingText = ref('')
const followUpText = ref('')
const followUpInputRef = ref<HTMLTextAreaElement | null>(null)
const chatBodyRef = ref<HTMLElement | null>(null)

/* ─── 中断控制 ─── */
let abortController: AbortController | null = null

/* ─── 全屏控制 ─── */
const isFullscreen = ref(false)
const dialogRef = ref<any>(null)

/* ─── AI 模型配置检测（支持登录用户 + 游客本地配置） ─── */
const aiConfigured = ref(false)
let guestConfig: GuestAiConfig | null = null
let guestActiveEntry: GuestProviderEntry | null = null
let guestActiveProvider = ''

async function checkAiConfigured()
{
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
  { key: 'polish', icon: 'fa-solid fa-wand-magic-sparkles', label: t('ai.polish') },
  { key: 'condense', icon: 'fa-solid fa-compress', label: t('ai.condense') },
  { key: 'custom', icon: 'fa-solid fa-pen-nib', label: t('ai.custom') },
])

/* ─── action key 到 label 映射（预览标题用） ─── */
const actionLabelMap = computed(() =>
{
  const m: Record<string, string> = {}
  for (const a of aiActions.value) m[a.key] = a.label
  return m
})

const previewTitle = computed(() =>
{
  const label = actionLabelMap.value[lastAction.value] || lastAction.value
  return t('ai.previewTitle', { action: label })
})

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

/* ─── 预览弹窗可见性（由 phase 驱动） ─── */
const previewVisible = computed({
  get: () => phase.value === 'preview',
  set: (val: boolean) =>
  {
    if (!val) closePreview()
  },
})

/* ─── 预览弹窗宽高本地缓存 ─── */
const AI_DIALOG_SIZE_KEY = 'ai-toolbar-dialog-size'

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
  return { w: 520, h: 420 }
}

const cachedSize = loadDialogSize()
const dialogWidth = ref(cachedSize.w)
const dialogHeight = ref(cachedSize.h)

// 全屏时用视口比例 1（UDialog 的 <=1 作为视口比例），否则使用缓存的 px 值
const currentDialogWidth = computed(() => isFullscreen.value ? 1 : dialogWidth.value)
const currentDialogHeight = computed(() => isFullscreen.value ? 1 : dialogHeight.value)

function onDialogResize(width: number, height: number)
{
  if (isFullscreen.value) return
  dialogWidth.value = width
  dialogHeight.value = height
  localStorage.setItem(AI_DIALOG_SIZE_KEY, JSON.stringify({ w: width, h: height }))
}

function toggleFullscreen()
{
  isFullscreen.value = !isFullscreen.value
  // 切換后重新初始化 UDialog 位置
  nextTick(() => dialogRef.value?.resetPosition?.())
}

/* ─── 可编辑元素检测 ─── */

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

/* ─── 选区检测 ─── */

function getInputSelection(el: HTMLInputElement | HTMLTextAreaElement): string
{
  const start = el.selectionStart ?? 0
  const end = el.selectionEnd ?? 0
  if (start === end) return ''
  return el.value.slice(start, end)
}

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
  if (!aiConfigured.value) return
  if (phase.value === 'preview' || phase.value === 'loading') return

  const target = e.target as HTMLElement
  if (target.closest('.global-ai-toolbar') || target.closest('.u-dialog'))
    return

  checkAndShowToolbar()
}

const toolbarRef = ref<HTMLElement | null>(null)

function showToolbar(text: string, pos: { top: number; left: number })
{
  clearHideTimer()
  selectedText.value = text
  toolbarPos.value = pos
  toolbarFlipped.value = false
  toolbarVisible.value = true
  phase.value = 'actions'
  aiResult.value = ''
  customPrompt.value = ''
  chatMessages.value = []
  followUpText.value = ''
  nextTick(adjustToolbarPosition)
}

function adjustToolbarPosition()
{
  const el = toolbarRef.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  const vw = window.innerWidth
  const MARGIN = 8

  if (rect.left < MARGIN)
    toolbarPos.value.left += MARGIN - rect.left

  if (rect.right > vw - MARGIN)
    toolbarPos.value.left -= rect.right - vw + MARGIN

  if (rect.top < MARGIN)
  {
    toolbarPos.value.top += rect.height + 24
    toolbarFlipped.value = true
  }

  if (rect.bottom > window.innerHeight - MARGIN)
    toolbarPos.value.top -= rect.bottom - window.innerHeight + MARGIN
}

/**
 * 检查当前选区并尝试弹出工具条
 * 适用于所有选区产生方式（鼠标、键盘、Ctrl+A 等）
 */
function checkAndShowToolbar(): boolean
{
  if (!aiConfigured.value) return false
  if (phase.value === 'preview' || phase.value === 'loading') return false

  const activeEl = document.activeElement
  const inputEl = (activeEl instanceof HTMLTextAreaElement || activeEl instanceof HTMLInputElement)
    ? activeEl as HTMLInputElement | HTMLTextAreaElement
    : null

  if (inputEl && (inputEl instanceof HTMLTextAreaElement || isTextInput(inputEl as HTMLInputElement)))
  {
    const text = getInputSelection(inputEl)
    if (text.trim().length >= MIN_SELECT_LEN)
    {
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
      return true
    }
  }

  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) return false

  const text = selection.toString().trim()
  if (text.length < MIN_SELECT_LEN) return false

  const anchorNode = selection.anchorNode
  if (!isInEditableContext(anchorNode)) return false

  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()

  showToolbar(text, {
    top: rect.top + window.scrollY - 8,
    left: rect.left + window.scrollX + rect.width / 2,
  })
  savedRange = range.cloneRange()
  savedInput = null
  return true
}

let selChangeTimer: ReturnType<typeof setTimeout> | null = null
const SEL_CHANGE_DELAY = 200

function handleSelectionChange()
{
  // preview / loading 阶段不响应
  if (phase.value === 'loading' || phase.value === 'preview') return

  const selection = window.getSelection()
  const hasContentEditableSelection = selection && !selection.isCollapsed && selection.toString().trim().length > 0

  const activeEl = document.activeElement
  let hasInputSelection = false
  if (activeEl instanceof HTMLTextAreaElement || activeEl instanceof HTMLInputElement)
  {
    const text = getInputSelection(activeEl as HTMLInputElement | HTMLTextAreaElement)
    hasInputSelection = text.trim().length > 0
  }

  if (!hasContentEditableSelection && !hasInputSelection)
  {
    // 选区清空 → 隐藏
    if (selChangeTimer)
    {
      clearTimeout(selChangeTimer); selChangeTimer = null
    }
    scheduleHide()
    return
  }

  // 工具条已显示时不重复触发
  if (toolbarVisible.value) return

  // 延迟触发，避免打字过程中频繁弹出
  if (selChangeTimer) clearTimeout(selChangeTimer)
  selChangeTimer = setTimeout(() =>
  {
    selChangeTimer = null; checkAndShowToolbar()
  }, SEL_CHANGE_DELAY)
}

function scheduleHide()
{
  clearHideTimer()
  hideTimer = setTimeout(() =>
  {
    // 不在 custom-input 聚焦时隐藏
    if (phase.value === 'custom-input') return
    toolbarVisible.value = false
    selectedText.value = ''
    phase.value = 'actions'
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

/* ─── 构建游客配置 ─── */
async function buildGuestConfig()
{
  if (!userStore.isLoggedIn && guestActiveEntry)
  {
    const p = findProvider(guestActiveProvider)
    return {
      apiKey: await encryptForTransport(guestActiveEntry.apiKey),
      baseUrl: guestActiveEntry.baseUrl ?? p?.baseUrl,
      model: guestActiveEntry.model,
    }
  }
  return undefined
}

/* ─── 中断 AI 请求 ─── */
function handleAbort()
{
  if (abortController)
  {
    abortController.abort()
    abortController = null
  }
  chatLoading.value = false

  // 如果有流式输出中的文本，保存为消息
  if (streamingText.value)
  {
    chatMessages.value.push({ role: 'assistant', content: streamingText.value })
    aiResult.value = streamingText.value
    streamingText.value = ''
    toolbarVisible.value = false
    phase.value = 'preview'
  }
  else if (phase.value === 'loading')
  {
    // 还没有任何输出就取消了，回到 actions
    phase.value = 'actions'
  }
}

/* ─── AI 操作处理 ─── */

async function executeAiAction(action: string, text: string, prompt?: string)
{
  phase.value = 'loading'
  lastAction.value = action

  const inlineConfig = await buildGuestConfig()

  // 首次操作使用非流式 API（简单快速）
  const result = await aiGenerate(action as AiAction, text, inlineConfig, prompt)

  if (!result)
  {
    phase.value = 'actions'
    return
  }

  aiResult.value = result
  chatMessages.value = [{ role: 'assistant', content: result }]

  toolbarVisible.value = false
  phase.value = 'preview'
  scrollChatToBottom()
}

async function handleAction(key: string)
{
  if (!selectedText.value) return

  if (key === 'custom')
  {
    phase.value = 'custom-input'
    customPrompt.value = ''
    nextTick(() =>
    {
      adjustToolbarPosition()
      customInputRef.value?.focus()
    })
    return
  }

  await executeAiAction(key, selectedText.value)
}

async function handleCustomSend()
{
  const prompt = customPrompt.value.trim()
  if (!prompt || !selectedText.value) return
  await executeAiAction('custom', selectedText.value, prompt)
}

/* ─── 追问（多轮对话 — SSE 流式） ─── */
async function handleFollowUp()
{
  const instruction = followUpText.value.trim()
  if (!instruction || chatLoading.value) return

  chatMessages.value.push({ role: 'user', content: instruction })
  followUpText.value = ''
  chatLoading.value = true
  streamingText.value = ''
  resetTextareaHeight()
  scrollChatToBottom()

  // 构建对话历史给 /chat SSE 接口
  const messages: ChatMessagePayload[] = [
    { role: 'user', content: `原文：\n${selectedText.value}` },
  ]
  for (const msg of chatMessages.value)
    messages.push({ role: msg.role, content: msg.content })

  abortController = new AbortController()

  try
  {
    const fullText = await sendChatMessageStream(
      messages,
      token =>
      {
        streamingText.value += token
        scrollChatToBottom()
      },
      abortController.signal,
    )

    // 流式完成，写入消息列表
    streamingText.value = ''
    chatMessages.value.push({ role: 'assistant', content: fullText })
    aiResult.value = fullText
  }
  catch (e)
  {
    if ((e as Error).name === 'AbortError')
    {
      // 用户手动取消 → streamingText 已在 handleAbort 中处理
    }
    else
    {
      const msg = (e as Error).message || t('ai.generateFailed')
      UMessageFn({ message: msg, type: 'error' })
      // 如有部分输出也保留
      if (streamingText.value)
      {
        chatMessages.value.push({ role: 'assistant', content: streamingText.value })
        aiResult.value = streamingText.value
        streamingText.value = ''
      }
    }
  }
  finally
  {
    abortController = null
    chatLoading.value = false
  }
  scrollChatToBottom()
}

/* ─── Textarea 自适应高度 + Shift+Enter ─── */
function handleFollowUpKeydown(e: KeyboardEvent)
{
  if (e.key === 'Enter' && !e.shiftKey)
  {
    e.preventDefault()
    handleFollowUp()
  }
  // Shift+Enter 默认行为即换行，不拦截
}

function autoResizeTextarea()
{
  const el = followUpInputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 120)}px`
}

function resetTextareaHeight()
{
  nextTick(() =>
  {
    const el = followUpInputRef.value
    if (el)
    
      el.style.height = 'auto'
    
  })
}

function scrollChatToBottom()
{
  nextTick(() =>
  {
    const el = chatBodyRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

/* ─── 替换选中文本 ─── */
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

/* ─── 插入到选区后方 ─── */
function insertAfterSelection(newText: string)
{
  if (savedInput)
  {
    try
    {
      savedInput.focus()
      // 光标移到选区末尾后插入
      savedInput.setSelectionRange(savedSelEnd, savedSelEnd)
      document.execCommand('insertText', false, newText)
      UMessageFn({ message: t('ai.inserted'), type: 'success' })
    }
    catch
    {
      const before = savedInput.value.slice(0, savedSelEnd)
      const after = savedInput.value.slice(savedSelEnd)
      savedInput.value = before + newText + after
      savedInput.dispatchEvent(new Event('input', { bubbles: true }))
      UMessageFn({ message: t('ai.inserted'), type: 'success' })
    }
    savedInput = null
    return
  }

  if (savedRange)
  {
    try
    {
      const selection = window.getSelection()
      const collapsed = savedRange.cloneRange()
      collapsed.collapse(false) // 折叠到选区末尾
      selection?.removeAllRanges()
      selection?.addRange(collapsed)
      document.execCommand('insertText', false, newText)
      UMessageFn({ message: t('ai.inserted'), type: 'success' })
    }
    catch
    {
      UMessageFn({ message: t('ai.replaceFailed'), type: 'error' })
    }
    savedRange = null
  }
}

/* ─── 预览面板操作 ─── */

function handleReplace()
{
  replaceSelectedText(aiResult.value)
  closePreview()
}

function handleInsertAfter()
{
  insertAfterSelection(aiResult.value)
  closePreview()
}

async function handleCopy()
{
  // 复制最新的 AI 回复
  const lastAssistant = [...chatMessages.value].reverse().find(m => m.role === 'assistant')
  const textToCopy = lastAssistant?.content || aiResult.value
  try
  {
    await navigator.clipboard.writeText(textToCopy)
    UMessageFn({ message: t('ai.copiedToClipboard'), type: 'success' })
  }
  catch
  {
    UMessageFn({ message: t('ai.copyFailed'), type: 'error' })
  }
}

function handleDiscard()
{
  closePreview()
}

function closePreview()
{
  // 中断进行中的请求
  if (abortController)
  {
    abortController.abort(); abortController = null
  }
  phase.value = 'actions'
  aiResult.value = ''
  toolbarVisible.value = false
  selectedText.value = ''
  chatMessages.value = []
  followUpText.value = ''
  chatLoading.value = false
  streamingText.value = ''
  isFullscreen.value = false
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
  if (selChangeTimer)
  {
    clearTimeout(selChangeTimer); selChangeTimer = null
  }
  if (abortController)
  {
    abortController.abort(); abortController = null
  }
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

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &--primary {
      color: var(--u-primary, #409eff);
    }

    &--stop {
      color: var(--u-danger, #f56c6c);

      &:hover {
        background: rgba(245, 108, 108, 0.1);
        color: var(--u-danger, #f56c6c);
      }
    }
  }

  /* 自定义指令输入态 */
  &__custom {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px;
  }

  &__input {
    width: 220px;
    height: 28px;
    padding: 0 8px;
    font-size: 12px;
    border: 1px solid var(--u-border-2, #e0e0e0);
    border-radius: 6px;
    background: var(--u-background-2, #f5f5f5);
    color: var(--u-text-1, #333);
    outline: none;
    transition: border-color 0.15s;

    &:focus {
      border-color: var(--u-primary, #409eff);
    }

    &::placeholder {
      color: var(--u-text-4, #bbb);
    }
  }
}

/* ========== UDialog 内的 AI 预览内容样式 ========== */
/* AI 对话弹窗：body 改为 flex 布局，输入框固定在底部 */
.u-dialog__body:has(> .global-ai-chat) {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ========== UDialog 内的 AI 对话样式 ========== */
.global-ai-chat {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding: 4px 0;

  &--fullscreen {
    padding: 8px 16px;
    gap: 14px;
  }

  &__msg {
    display: flex;

    &--user {
      justify-content: flex-end;
    }

    &--assistant {
      justify-content: flex-start;
    }
  }

  &__bubble {
    max-width: 85%;
    padding: 8px 12px;
    border-radius: 10px;
    font-size: 14px;
    line-height: 1.7;
    word-break: break-word;

    // Markdown 渲染重置
    p { margin: 0 0 0.5em; }
    p:last-child { margin-bottom: 0; }
    pre {
      background: var(--u-background-3, #f0f0f0);
      padding: 8px 10px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 13px;
    }
    code {
      font-size: 13px;
      background: var(--u-background-3, #f0f0f0);
      padding: 1px 4px;
      border-radius: 3px;
    }
    pre code {
      background: none;
      padding: 0;
    }
    ul, ol { margin: 4px 0; padding-left: 20px; }

    .global-ai-chat__msg--assistant & {
      background: var(--u-background-2, #f5f5f5);
      color: var(--u-text-1, #333);
      border-bottom-left-radius: 2px;
    }

    .global-ai-chat__msg--user & {
      background: var(--u-primary, #409eff);
      color: #fff;
      border-bottom-right-radius: 2px;
      white-space: pre-wrap;
    }

    &--loading {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--u-text-3, #999);

      .u-icon {
        animation: global-ai-spin 1s linear infinite;
      }
    }
  }

  &__cursor {
    display: inline-block;
    width: 2px;
    height: 1em;
    background: var(--u-primary, #409eff);
    vertical-align: text-bottom;
    margin-left: 1px;
    animation: global-ai-blink 0.8s steps(2) infinite;
  }

  &__input-row {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    padding-top: 8px;
    border-top: 1px solid var(--u-border-2, #e0e0e0);
    flex-shrink: 0;
  }

  &__input {
    flex: 1;
    min-height: 36px;
    max-height: 120px;
    padding: 6px 10px;
    font-size: 13px;
    font-family: inherit;
    border: 1px solid var(--u-border-2, #e0e0e0);
    border-radius: 8px;
    background: var(--u-background-1, #fff);
    color: var(--u-text-1, #333);
    outline: none;
    resize: none;
    overflow-y: auto;
    line-height: 1.5;
    transition: border-color 0.15s;

    &:focus {
      border-color: var(--u-primary, #409eff);
    }

    &::placeholder {
      color: var(--u-text-4, #bbb);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &__send {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border: none;
    border-radius: 8px;
    background: var(--u-primary, #409eff);
    color: #fff;
    font-size: 13px;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s;

    &:hover {
      background: var(--u-primary-dark-2, #337ecc);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &--stop {
      background: var(--u-danger, #f56c6c);

      &:hover {
        background: var(--u-danger-dark, #e64545);
      }
    }
  }
}

.global-ai-preview__content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--u-text-1, #333);
  white-space: pre-wrap;
  word-break: break-word;
}

.global-ai-preview__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
}

.global-ai-preview__actions-left,
.global-ai-preview__actions-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.global-ai-preview__btn {
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

@keyframes global-ai-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes global-ai-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
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

  .global-ai-toolbar__input {
    width: 160px;
  }
}
</style>
