<!--
  FloatingChatWidget — 右下角浮动客服式对话入口
  复用小惠 (Xiaohui) 的 SSE 流式接口，提供快捷对话能力。
  仅在 PC 端（>768px）显示；在小惠/助手页面自动隐藏，避免重复。
-->
<template>
  <Teleport to="body">
    <!-- 浮动按钮 -->
    <Transition name="fcw-fab-fade">
      <button
        v-show="fabVisible"
        class="fcw-fab"
        :title="t('chatWidget.open')"
        @click="togglePanel"
      >
        <u-icon v-if="!panelVisible" icon="fa-solid fa-comment-dots" />
        <u-icon v-else icon="fa-solid fa-xmark" />
        <!-- 未读指示点 -->
        <span v-if="hasUnread && !panelVisible" class="fcw-fab__dot" />
      </button>
    </Transition>

    <!-- 对话面板 -->
    <Transition name="fcw-panel-slide">
      <div v-if="panelVisible" class="fcw-panel">
        <!-- 头部 -->
        <div class="fcw-panel__header">
          <div class="fcw-panel__header-info">
            <span class="fcw-panel__avatar">🤖</span>
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
            <span class="fcw-panel__empty-emoji">💬</span>
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
              <div v-if="msg.role === 'assistant'" class="fcw-msg__avatar">🤖</div>
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
            <div class="fcw-msg__avatar">🤖</div>
            <div class="fcw-msg__bubble fcw-msg__bubble--loading">
              <u-icon icon="fa-solid fa-spinner" />
              <span>{{ t('ai.processing') }}</span>
            </div>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="fcw-panel__footer">
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
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { sendXiaohuiStream, type XiaohuiMessage } from '@/api/xiaohui'
import { normalizeStreamingMarkdown } from '@/utils/markdownStreaming'
import MarkdownPreview from '@/components/MarkdownPreview.vue'

defineOptions({ name: 'FloatingChatWidget' })

const { t } = useI18n()
const route = useRoute()

/* ─── 可见性控制 ─── */
const panelVisible = ref(false)
const hasUnread = ref(false)

// 在小惠 / 助手页面隐藏，避免功能重复
const hiddenRoutes = ['xiaohui', 'chat']
const fabVisible = computed(() => !hiddenRoutes.includes(route.name as string))

function togglePanel()
{
  panelVisible.value = !panelVisible.value
  if (panelVisible.value)
  {
    hasUnread.value = false
    nextTick(() =>
    {
      scrollToBottom()
      inputRef.value?.focus()
    })
  }
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
/* ========== 浮动按钮 ========== */
.fcw-fab {
  position: fixed;
  z-index: 9999;
  right: 24px;
  bottom: 24px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: var(--u-primary, #409eff);
  color: #fff;
  font-size: 22px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  transition: background 0.2s, transform 0.2s, box-shadow 0.2s;

  &:hover {
    background: var(--u-primary-dark-2, #337ecc);
    transform: scale(1.08);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25);
  }

  &:active {
    transform: scale(0.96);
  }

  &__dot {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--u-danger, #f56c6c);
    border: 2px solid #fff;
    animation: fcw-dot-pulse 1.5s ease-in-out infinite;
  }

  // 移动端隐藏
  @media (max-width: 768px) {
    display: none;
  }
}

/* ========== 对话面板 ========== */
.fcw-panel {
  position: fixed;
  z-index: 9998;
  right: 24px;
  bottom: 88px;
  width: 380px;
  height: 540px;
  max-height: calc(100vh - 120px);
  border-radius: 16px;
  background: var(--u-background-1, #fff);
  border: 1px solid var(--u-border-2, #e0e0e0);
  box-shadow: 0 8px 36px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 768px) {
    display: none;
  }

  /* ── 头部 ── */
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--u-primary, #409eff);
    color: #fff;
    flex-shrink: 0;
  }

  &__header-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__avatar {
    font-size: 28px;
    line-height: 1;
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
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
  }

  /* ── 空状态 ── */
  &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--u-text-3, #999);
    font-size: 13px;
    text-align: center;
    padding: 16px;
  }

  &__empty-emoji {
    font-size: 40px;
    margin-bottom: 4px;
  }

  &__prompts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 12px;
    justify-content: center;
  }

  &__prompt-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 10px;
    font-size: 12px;
    border: 1px solid var(--u-border-2, #e0e0e0);
    border-radius: 16px;
    background: var(--u-background-1, #fff);
    color: var(--u-text-2, #666);
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      border-color: var(--u-primary, #409eff);
      color: var(--u-primary, #409eff);
      background: var(--u-primary-light-9, rgba(64, 158, 255, 0.05));
    }
  }

  /* ── 输入区 ── */
  &__footer {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    padding: 10px 14px;
    border-top: 1px solid var(--u-border-2, #e0e0e0);
    flex-shrink: 0;
    background: var(--u-background-1, #fff);
  }

  &__input {
    flex: 1;
    min-height: 36px;
    max-height: 100px;
    padding: 7px 10px;
    font-size: 13px;
    font-family: inherit;
    border: 1px solid var(--u-border-2, #e0e0e0);
    border-radius: 10px;
    background: var(--u-background-2, #f5f5f5);
    color: var(--u-text-1, #333);
    outline: none;
    resize: none;
    overflow-y: auto;
    line-height: 1.5;
    transition: border-color 0.15s;

    &:focus {
      border-color: var(--u-primary, #409eff);
      background: var(--u-background-1, #fff);
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
    border-radius: 10px;
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
    font-size: 20px;
    line-height: 1;
    margin-top: 4px;
  }

  &__bubble {
    max-width: 82%;
    padding: 8px 12px;
    border-radius: 12px;
    font-size: 13px;
    line-height: 1.6;
    word-break: break-word;

    .fcw-msg--assistant & {
      background: var(--u-background-2, #f5f5f5);
      color: var(--u-text-1, #333);
      border-bottom-left-radius: 2px;

      // MarkdownPreview 样式覆盖
      .markdown-preview {
        font-size: 13px !important;

        .md-editor-preview-wrapper {
          padding: 0 !important;
        }
      }
    }

    .fcw-msg--user & {
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
