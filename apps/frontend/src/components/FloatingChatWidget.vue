<!--
  FloatingChatWidget — 右下角浮动客服式对话入口
  复用小惠 (Xiaohui) 的 SSE 流式接口，提供快捷对话能力。
  仅在 PC 端（>768px）显示；在小惠/助手页面自动隐藏，避免重复。
-->
<template>
  <Teleport to="body">
    <div
      v-show="fabVisible"
      ref="widgetRef"
      class="fcw-root"
      :class="{ 'is-open': panelVisible, 'is-dragging': widgetDragging }"
      :style="widgetStyle"
    >
      <Transition name="fcw-fab-fade">
        <button
          v-show="!panelVisible"
          class="fcw-launcher fcw-drag-handle"
          :title="t('chatWidget.open')"
          @click="handleLauncherClick"
        >
          <img :src="xiaohuiAvatar" :alt="t('xiaohui.name')" class="fcw-launcher__avatar" />
          <div class="fcw-launcher__copy">
            <div class="fcw-launcher__eyebrow">{{ t('chatWidget.open') }}</div>
            <div class="fcw-launcher__title">{{ t('xiaohui.name') }}</div>
            <div class="fcw-launcher__desc">{{ t('xiaohui.hint') }}</div>
          </div>
          <div class="fcw-launcher__action">
            <u-icon icon="fa-solid fa-sparkles" />
          </div>
          <span v-if="hasUnread" class="fcw-launcher__dot" />
        </button>
      </Transition>

      <Transition name="fcw-panel-slide">
        <div v-if="panelVisible" class="fcw-panel">
        <!-- 头部 -->
        <div class="fcw-panel__header">
          <div class="fcw-panel__header-info fcw-drag-handle">
            <img :src="xiaohuiAvatar" :alt="t('xiaohui.name')" class="fcw-panel__avatar" />
            <div>
              <div class="fcw-panel__name">{{ t('xiaohui.name') }}</div>
              <div class="fcw-panel__hint">{{ t('xiaohui.hint') }}</div>
            </div>
          </div>
          <div class="fcw-panel__header-actions">
            <button class="fcw-panel__header-btn" :title="t('chatWidget.newChat')" @click="handleNewChat">
              <u-icon icon="fa-solid fa-plus" />
            </button>
            <button class="fcw-panel__header-btn" :title="t('chatWidget.close')" @click="panelVisible = false">
              <u-icon icon="fa-solid fa-xmark" />
            </button>
          </div>
        </div>

        <!-- 消息列表 -->
        <div ref="chatBodyRef" class="fcw-panel__body">
          <!-- 空状态 -->
          <div v-if="!messages.length && !streaming" class="fcw-panel__empty">
            <img :src="xiaohuiAvatar" :alt="t('xiaohui.name')" class="fcw-panel__empty-avatar" />
            <p>{{ t('xiaohui.emptyDesc') }}</p>
            <!-- 快捷提示词 -->
            <div class="fcw-panel__prompts">
              <button
                v-for="(p, idx) in quickPrompts"
                :key="idx"
                class="fcw-panel__prompt-btn"
                @click="sendQuickPrompt(p.text)"
              >
                <u-icon :icon="p.icon" />
                <span>{{ p.label }}</span>
              </button>
            </div>
          </div>

          <!-- 消息气泡 -->
          <template v-for="(msg, idx) in messages" :key="msg.id">
            <div class="fcw-msg" :class="`fcw-msg--${msg.role}`">
              <img
                v-if="msg.role === 'assistant'"
                :src="xiaohuiAvatar"
                :alt="t('xiaohui.name')"
                class="fcw-msg__avatar"
              />
              <div class="fcw-msg__bubble">
                <MarkdownPreview
                  v-if="msg.role === 'assistant'"
                  :content="normalizeStreamingMarkdown(msg.content, streaming && idx === messages.length - 1)"
                  :code-foldable="false"
                />
                <span v-else>{{ msg.content }}</span>
              </div>
            </div>
          </template>

          <!-- 流式光标 -->
          <div v-if="streaming && messages.length && messages[messages.length - 1].role === 'assistant'" class="fcw-msg__cursor-wrap">
            <span class="fcw-msg__cursor" />
          </div>

          <!-- loading（还没有 token 时） -->
          <div v-if="loading && !streaming" class="fcw-msg fcw-msg--assistant">
            <img :src="xiaohuiAvatar" :alt="t('xiaohui.name')" class="fcw-msg__avatar" />
            <div class="fcw-msg__bubble fcw-msg__bubble--loading">
              <u-icon icon="fa-solid fa-spinner" />
              <span>{{ t('ai.processing') }}</span>
            </div>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="fcw-panel__footer">
          <div class="fcw-panel__input-shell">
            <textarea
              ref="inputRef"
              v-model="inputText"
              class="fcw-panel__input"
              :placeholder="t('xiaohui.placeholder')"
              :disabled="loading"
              rows="1"
              @keydown="handleInputKeydown"
              @input="autoResizeInput"
            />
            <button
              v-if="loading"
              class="fcw-panel__send fcw-panel__send--stop"
              :title="t('xiaohui.stop')"
              @click="handleStop"
            >
              <u-icon icon="fa-solid fa-stop" />
            </button>
            <button
              v-else
              class="fcw-panel__send"
              :disabled="!inputText.trim()"
              @click="handleSend"
            >
              <u-icon icon="fa-solid fa-paper-plane" />
            </button>
          </div>
        </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { sendXiaohuiStream, type XiaohuiMessage } from '@/api/xiaohui'
import { normalizeStreamingMarkdown } from '@/utils/markdownStreaming'
import MarkdownPreview from '@/components/MarkdownPreview.vue'
import { useDraggablePosition } from '@/composables/useDraggablePosition'
import { STORAGE_KEYS } from '@/constants/storage'
import xiaohuiAvatar from '@/assets/images/xiaohui.png'

defineOptions({ name: 'FloatingChatWidget' })

const { t } = useI18n()
const route = useRoute()
const widgetRef = ref<HTMLElement | null>(null)

/* ─── 可见性控制 ─── */
const panelVisible = ref(false)
const hasUnread = ref(false)

// 在小惠 / 助手页面隐藏，避免功能重复
const hiddenRoutes = ['xiaohui', 'chat']
const fabVisible = computed(() => !hiddenRoutes.includes(route.name as string))

const {
  position: widgetPosition,
  isDragging: widgetDragging,
  ensureInViewport,
} = useDraggablePosition(widgetRef, {
  storageKey: STORAGE_KEYS.FLOATING_CHAT_WIDGET_POSITION,
  defaultPosition: { right: 40, bottom: 40 },
  edgePadding: 16,
  dragHandleSelector: '.fcw-drag-handle',
})

const widgetStyle = computed(() => ({
  right: `${widgetPosition.value.right}px`,
  bottom: `${widgetPosition.value.bottom}px`,
}))

function togglePanel()
{
  panelVisible.value = !panelVisible.value
}

function handleLauncherClick()
{
  if (widgetDragging.value) return
  togglePanel()
}

/* ─── 消息管理 ─── */
interface LocalMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const STORAGE_KEY = 'u-blog:fcw-messages'
const SESSION_KEY = 'u-blog:fcw-session-id'

const messages = ref<LocalMessage[]>([])
const inputText = ref('')
const loading = ref(false)
const streaming = ref(false)
const inputRef = ref<HTMLTextAreaElement | null>(null)
const chatBodyRef = ref<HTMLElement | null>(null)
let abortController: AbortController | null = null
let sessionId = ''

function genId(): string
{
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// 从 localStorage 恢复
function loadMessages()
{
  try
  {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) messages.value = JSON.parse(raw)
  }
  catch
  { /* ignore */ }

  sessionId = localStorage.getItem(SESSION_KEY) || genId()
  localStorage.setItem(SESSION_KEY, sessionId)
}

function saveMessages()
{
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.value))
}

onMounted(loadMessages)

// 自动保存
watch(messages, saveMessages, { deep: true })
watch(panelVisible, visible =>
{
  if (visible)
  {
    hasUnread.value = false
    nextTick(() =>
    {
      ensureInViewport()
      scrollToBottom()
      inputRef.value?.focus()
    })
    return
  }

  nextTick(() =>
  {
    ensureInViewport()
  })
})

/* ─── 快捷提示词 ─── */
const quickPrompts = computed(() => [
  { icon: 'fa-solid fa-hand-sparkles', label: t('xiaohui.promptGreet'), text: t('xiaohui.promptGreet') },
  { icon: 'fa-solid fa-pen-fancy', label: t('xiaohui.promptWrite'), text: t('xiaohui.promptWrite') },
  { icon: 'fa-solid fa-fire', label: t('xiaohui.promptHotArticles'), text: t('xiaohui.promptHotArticles') },
  { icon: 'fa-solid fa-lightbulb', label: t('xiaohui.promptIdea'), text: t('xiaohui.promptIdea') },
])

function sendQuickPrompt(text: string)
{
  inputText.value = text
  handleSend()
}

/* ─── 发送消息 ─── */
async function handleSend()
{
  const text = inputText.value.trim()
  if (!text || loading.value) return

  // 用户消息
  messages.value.push({
    id: genId(),
    role: 'user',
    content: text,
    timestamp: Date.now(),
  })
  inputText.value = ''
  resetInputHeight()
  loading.value = true
  scrollToBottom()

  // 准备对话历史
  const payloadMessages: XiaohuiMessage[] = messages.value.map(m => ({
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
  }))

  // 创建空的 assistant 占位
  const assistantMsg: LocalMessage = {
    id: genId(),
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
  }
  messages.value.push(assistantMsg)
  streaming.value = true

  abortController = new AbortController()

  try
  {
    await sendXiaohuiStream(
      payloadMessages,
      sessionId,
      token =>
      {
        assistantMsg.content += token
        scrollToBottom()
      },
      abortController.signal,
    )
  }
  catch (e)
  {
    if ((e as Error).name === 'AbortError')
    {
      // 用户手动取消
    }
    else
    
      assistantMsg.content = assistantMsg.content || t('xiaohui.error')
    
  }
  finally
  {
    abortController = null
    loading.value = false
    streaming.value = false
    scrollToBottom()

    // 如果面板关闭了，标记未读
    if (!panelVisible.value && assistantMsg.content)
    
      hasUnread.value = true
    
  }
}

/* ─── 停止 ─── */
function handleStop()
{
  if (abortController)
  {
    abortController.abort()
    abortController = null
  }
  loading.value = false
  streaming.value = false
}

/* ─── 新对话 ─── */
function handleNewChat()
{
  handleStop()
  messages.value = []
  sessionId = genId()
  localStorage.setItem(SESSION_KEY, sessionId)
  saveMessages()
  nextTick(() => inputRef.value?.focus())
}

/* ─── 键盘 & 输入 ─── */
function handleInputKeydown(e: KeyboardEvent)
{
  if (e.key === 'Enter' && !e.shiftKey)
  {
    e.preventDefault()
    handleSend()
  }
}

function autoResizeInput()
{
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 100)}px`
}

function resetInputHeight()
{
  nextTick(() =>
  {
    const el = inputRef.value
    if (el) el.style.height = 'auto'
  })
}

/* ─── 滚动 ─── */
function scrollToBottom()
{
  nextTick(() =>
  {
    const el = chatBodyRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

/* ─── 清理 ─── */
onBeforeUnmount(() =>
{
  if (abortController)
  {
    abortController.abort()
    abortController = null
  }
})
</script>

<style lang="scss">
/* ========== 根容器 ========== */
.fcw-root {
  position: fixed;
  z-index: 9999;
  width: fit-content;

  &.is-dragging {
    user-select: none;
  }

  @media (max-width: 768px) {
    display: none;
  }
}

/* ========== 卡片式入口 ========== */
.fcw-launcher {
  position: relative;
  width: 240px;
  min-height: 76px;
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) 34px;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(90, 126, 255, 0.32);
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(113, 174, 255, 0.22), transparent 34%),
    linear-gradient(135deg, rgba(37, 60, 112, 0.96), rgba(24, 28, 51, 0.96));
  box-shadow: 0 16px 42px rgba(6, 11, 30, 0.34);
  backdrop-filter: blur(16px);
  color: #fff;
  cursor: grab;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 48px rgba(6, 11, 30, 0.42);
    border-color: rgba(122, 169, 255, 0.6);
  }

  &:active {
    cursor: grabbing;
  }

  &__avatar {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    object-fit: cover;
    border: 1px solid rgba(255, 255, 255, 0.22);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.24);
  }

  &__copy {
    min-width: 0;
    text-align: left;
  }

  &__eyebrow {
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(233, 241, 255, 0.72);
  }

  &__title {
    margin-top: 2px;
    font-size: 18px;
    font-weight: 700;
    line-height: 1.1;
  }

  &__desc {
    margin-top: 4px;
    font-size: 11px;
    color: rgba(233, 241, 255, 0.82);
    line-height: 1.35;
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  &__action {
    width: 34px;
    height: 34px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.14);
    font-size: 14px;
    color: #fff;
  }

  &__dot {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--u-danger, #f56c6c);
    border: 2px solid rgba(12, 16, 36, 0.95);
    animation: fcw-dot-pulse 1.5s ease-in-out infinite;
  }
}

/* ========== 对话面板 ========== */
.fcw-panel {
  width: 396px;
  height: 560px;
  max-height: calc(100vh - 120px);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(26, 29, 45, 0.98), rgba(20, 20, 28, 0.98));
  border: 1px solid rgba(101, 121, 168, 0.3);
  box-shadow: 0 22px 56px rgba(0, 0, 0, 0.42);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  /* ── 头部 ── */
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: linear-gradient(135deg, #4a8bff, #2f5ec8);
    color: #fff;
    flex-shrink: 0;
  }

  &__header-info {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }

  &__avatar {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    object-fit: cover;
    border: 1px solid rgba(255, 255, 255, 0.26);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.22);
  }

  &__name {
    font-size: 15px;
    font-weight: 600;
  }

  &__hint {
    font-size: 11px;
    opacity: 0.85;
    margin-top: 2px;
  }

  &__header-actions {
    display: flex;
    gap: 4px;
  }

  &__header-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }

  /* ── 消息区 ── */
  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 16px 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
    background: rgba(22, 22, 28, 0.92);
  }

  /* ── 空状态 ── */
  &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: rgba(233, 241, 255, 0.72);
    font-size: 13px;
    text-align: center;
    padding: 24px 16px;
  }

  &__empty-avatar {
    width: 92px;
    height: 92px;
    object-fit: cover;
    border-radius: 26px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22);
    margin-bottom: 6px;
  }

  &__prompts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
    justify-content: center;
  }

  &__prompt-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 7px 12px;
    font-size: 12px;
    border: 1px solid rgba(139, 153, 190, 0.26);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.03);
    color: rgba(239, 243, 255, 0.86);
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      border-color: rgba(108, 156, 255, 0.62);
      color: #fff;
      background: rgba(84, 128, 235, 0.16);
    }
  }

  /* ── 输入区 ── */
  &__footer {
    padding: 14px 16px 16px;
    border-top: 1px solid rgba(139, 153, 190, 0.16);
    flex-shrink: 0;
    background: rgba(24, 24, 32, 0.96);
  }

  &__input-shell {
    position: relative;
    display: flex;
    align-items: flex-end;
  }

  &__input {
    width: 100%;
    min-height: 36px;
    max-height: 110px;
    padding: 13px 58px 13px 14px;
    font-size: 14px;
    font-family: inherit;
    border: 1px solid rgba(98, 118, 165, 0.26);
    border-radius: 18px;
    background: rgba(10, 14, 26, 0.55);
    color: rgba(248, 250, 255, 0.96);
    outline: none;
    resize: none;
    overflow-y: auto;
    line-height: 1.55;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;

    &:focus {
      border-color: rgba(110, 162, 255, 0.7);
      background: rgba(10, 14, 26, 0.72);
      box-shadow: 0 0 0 3px rgba(86, 132, 243, 0.16);
    }

    &::placeholder {
      color: rgba(198, 207, 228, 0.42);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &__send {
    position: absolute;
    right: 10px;
    bottom: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border: none;
    border-radius: 14px;
    background: linear-gradient(135deg, #5b8fff, #3664cf);
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    flex-shrink: 0;
    transition: transform 0.15s ease, filter 0.15s ease;

    &:hover {
      transform: translateY(-1px);
      filter: brightness(1.06);
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

/* ========== 消息气泡 ========== */
.fcw-msg {
  display: flex;
  gap: 8px;

  &--user {
    justify-content: flex-end;
  }

  &--assistant {
    justify-content: flex-start;
  }

  &__avatar {
    flex-shrink: 0;
    width: 30px;
    height: 30px;
    object-fit: cover;
    border-radius: 11px;
    margin-top: 4px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  &__bubble {
    max-width: 82%;
    padding: 10px 13px;
    border-radius: 16px;
    font-size: 13px;
    line-height: 1.6;
    word-break: break-word;

    .fcw-msg--assistant & {
      background: rgba(255, 255, 255, 0.05);
      color: rgba(242, 246, 255, 0.92);
      border: 1px solid rgba(126, 143, 185, 0.16);
      border-bottom-left-radius: 4px;

      // MarkdownPreview 样式覆盖
      .markdown-preview {
        font-size: 13px !important;
        color: inherit;

        .md-editor-preview-wrapper {
          padding: 0 !important;
        }
      }
    }

    .fcw-msg--user & {
      background: linear-gradient(135deg, #4d86ff, #3262cd);
      color: #fff;
      border-bottom-right-radius: 4px;
      white-space: pre-wrap;
    }

    &--loading {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--u-text-3, #999);
      font-size: 12px;

      .u-icon {
        animation: fcw-spin 1s linear infinite;
      }
    }
  }

  &__cursor-wrap {
    display: flex;
    padding-left: 36px;
  }

  &__cursor {
    display: inline-block;
    width: 2px;
    height: 14px;
    background: var(--u-primary, #409eff);
    animation: fcw-blink 0.8s steps(2) infinite;
  }
}

/* ========== 动画 ========== */
@keyframes fcw-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fcw-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes fcw-dot-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
}

/* ── FAB 淡入/淡出 ── */
.fcw-fab-fade-enter-active,
.fcw-fab-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fcw-fab-fade-enter-from,
.fcw-fab-fade-leave-to {
  opacity: 0;
  transform: scale(0.6);
}

/* ── 面板滑入/滑出 ── */
.fcw-panel-slide-enter-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fcw-panel-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fcw-panel-slide-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.fcw-panel-slide-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
</style>
