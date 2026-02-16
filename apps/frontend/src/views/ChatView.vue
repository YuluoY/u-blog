<template>
  <div class="chat-view">
    <!-- 左侧主区：消息列表 + 输入区 -->
    <div class="chat-main">
      <!-- 消息列表区 -->
      <div ref="messageListRef" class="chat-messages">
        <template v-if="!chatStore.currentMessages.length">
          <div class="chat-empty">
            <div class="chat-empty__logo">
              <div class="chat-empty__icon-wrap">
                <u-icon icon="fa-solid fa-robot" class="chat-empty__icon" />
              </div>
              <div class="chat-empty__glow"></div>
            </div>
            <u-text class="chat-empty__title">小惠</u-text>
            <u-text class="chat-empty__desc">有什么可以帮助你的吗？</u-text>
            <div class="chat-empty__suggestions">
              <div
                v-for="(suggestion, idx) in suggestions"
                :key="idx"
                class="chat-empty__suggestion"
                @click="handleSuggestionClick(suggestion)"
              >
                <div class="chat-empty__suggestion-icon-wrap">
                  <u-icon :icon="suggestion.icon" class="chat-empty__suggestion-icon" />
                </div>
                <u-text class="chat-empty__suggestion-text">{{ suggestion.text }}</u-text>
              </div>
            </div>
          </div>
        </template>
        <TransitionGroup v-else name="message" tag="div" class="chat-messages-list">
          <div
            v-for="message in chatStore.currentMessages"
            :key="message.id"
            :class="['chat-message', `chat-message--${message.role}`]"
          >
            <div class="chat-message__avatar">
              <u-icon :icon="message.role === 'user' ? 'fa-solid fa-user' : 'fa-solid fa-robot'" />
            </div>
            <div class="chat-message__content">
              <div class="chat-message__meta">
                <span class="chat-message__name">{{ message.role === 'user' ? '你' : '小惠' }}</span>
                <span class="chat-message__time">{{ formatTime(message.timestamp) }}</span>
              </div>
              <div class="chat-message__bubble">
                <div class="chat-message__text">{{ message.content }}</div>
              </div>
            </div>
          </div>
          <div v-if="loading" key="loading" class="chat-message chat-message--assistant">
            <div class="chat-message__avatar">
              <u-icon icon="fa-solid fa-robot" />
            </div>
            <div class="chat-message__content">
              <div class="chat-message__meta">
                <span class="chat-message__name">小惠</span>
              </div>
              <div class="chat-message__bubble chat-message__bubble--loading">
                <div class="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- 输入区 -->
      <div class="chat-input-container">
        <div class="chat-input-bar">
          <textarea
            ref="inputRef"
            id="chat-message-input"
            name="chat-message"
            v-model="inputText"
            class="chat-input-bar__textarea"
            placeholder="输入消息，Enter 发送，Shift+Enter 换行"
            :disabled="loading"
            rows="1"
            @keydown="handleInputKeydown"
            @input="autoResizeTextarea"
          ></textarea>
          <button
            class="chat-input-bar__send"
            :class="{ 'is-active': inputText.trim() && !loading }"
            :disabled="!inputText.trim() || loading"
            @click="handleSend"
          >
            <u-icon v-if="!loading" icon="fa-solid fa-arrow-up" />
            <u-icon v-else icon="fa-solid fa-circle-notch" class="spin" />
          </button>
        </div>
        <div class="chat-input-hint">AI 生成的内容可能不准确，请核对重要信息。</div>
      </div>
    </div>

    <!-- 侧栏折叠按钮（独立于侧栏，不受 overflow 影响） -->
    <button
      class="sidebar-toggle"
      @click="sidebarVisible = !sidebarVisible"
      :title="sidebarVisible ? '收起侧栏' : '展开侧栏'"
    >
      <u-icon :icon="sidebarVisible ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left'" />
    </button>

    <!-- 右侧：历史会话侧栏 -->
    <aside class="chat-sidebar" :class="{ 'chat-sidebar--collapsed': !sidebarVisible }">
        <div class="chat-sidebar__header">
          <div class="chat-sidebar__title-area">
            <u-icon icon="fa-solid fa-history" />
            <span>历史会话</span>
          </div>
          <button class="chat-new-btn" @click="handleNewSession" title="新对话">
            <u-icon icon="fa-solid fa-plus" />
          </button>
        </div>
        
        <div class="chat-sidebar__content">
          <template v-if="chatStore.sortedSessions.length === 0">
            <div class="chat-sidebar__empty">
              <u-icon icon="fa-solid fa-comments" class="chat-sidebar__empty-icon" />
              <span>暂无历史会话</span>
            </div>
          </template>
          <div v-else class="session-list">
            <div
              v-for="session in chatStore.sortedSessions"
              :key="session.id"
              :class="['session-item', { 'session-item--active': session.id === chatStore.currentSessionId }]"
              @click="handleSessionClick(session.id)"
            >
              <!-- 标题行 -->
              <div class="session-item__head">
                <div class="session-item__title" @dblclick="startEditing(session)">
                  <template v-if="editingSessionId !== session.id">{{ session.title }}</template>
                  <input
                    v-else
                    v-model="editingTitle"
                    class="session-item__edit-input"
                    @blur="finishEditing"
                    @keydown.enter.prevent="finishEditing"
                    @keydown.esc="cancelEditing"
                    @click.stop
                  />
                </div>
                <span class="session-item__time">{{ formatTime(session.updatedAt) }}</span>
              </div>
              <!-- 预览行 + 内置操作 -->
              <div class="session-item__foot">
                <span class="session-item__preview">{{ getLastMessage(session) || '新对话' }}</span>
                <div class="session-item__actions" @click.stop>
                  <button class="session-action-btn" title="重命名" @click="startEditing(session)">
                    <u-icon icon="fa-solid fa-pen" />
                  </button>
                  <button class="session-action-btn session-action-btn--danger" title="删除" @click="requestDelete(session.id)">
                    <u-icon icon="fa-solid fa-trash" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

    <!-- 删除确认对话框 -->
    <u-dialog
      v-model="showDeleteDialog"
      title="删除会话"
      :width="400"
      :height="200"
      modal
      @confirm="confirmDelete"
      @cancel="showDeleteDialog = false"
    >
      <div class="delete-confirm">
        <div class="delete-confirm__icon">
          <u-icon icon="fa-solid fa-trash-alt" />
        </div>
        <div class="delete-confirm__body">
          <h3>确认删除？</h3>
          <p>删除后该会话将无法恢复，请谨慎操作。</p>
        </div>
      </div>
    </u-dialog>
  </div>
</template>

<script setup lang="ts">
import { sendChatMessage } from '@/api/chat'
import { STORAGE_KEYS } from '@/constants/storage'
import { useChatStore } from '@/stores/chat'

defineOptions({ name: 'ChatView' })

const chatStore = useChatStore()
const inputText = ref('')
const inputRef = ref<HTMLTextAreaElement | null>(null)
const loading = ref(false)
const messageListRef = ref<HTMLElement | null>(null)
const showDeleteDialog = ref(false)
const sessionToDelete = ref<string | null>(null)
const editingSessionId = ref<string | null>(null)
const editingTitle = ref('')
function loadSidebarVisible(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.CHAT_SIDEBAR_VISIBLE)
    if (v === 'true' || v === 'false') return v === 'true'
  } catch { /* ignore */ }
  return true
}

const sidebarVisible = ref(loadSidebarVisible())

watch(sidebarVisible, (val) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CHAT_SIDEBAR_VISIBLE, String(val))
  } catch { /* ignore */ }
}, { immediate: true })

const suggestions = [
  { icon: 'fa-solid fa-pen-nib', text: '帮我写一篇文章' },
  { icon: 'fa-solid fa-code', text: '解释一段代码' },
  { icon: 'fa-solid fa-language', text: '翻译一段文字' },
  { icon: 'fa-solid fa-brain', text: '头脑风暴' },
]

onMounted(() => {
  if (!chatStore.currentSessionId && chatStore.sortedSessions.length === 0) {
    chatStore.createSession()
  }
})

function handleSessionClick(sessionId: string) {
  if (sessionId !== chatStore.currentSessionId) {
    chatStore.switchSession(sessionId)
    nextTick(scrollToBottom)
  }
}

function startEditing(session: any) {
  editingSessionId.value = session.id
  editingTitle.value = session.title
  nextTick(() => {
    const input = document.querySelector('.session-item__edit-input') as HTMLInputElement
    input?.focus()
    input?.select()
  })
}

function finishEditing() {
  if (editingSessionId.value && editingTitle.value.trim()) {
    chatStore.updateSessionTitle(editingSessionId.value, editingTitle.value.trim())
  }
  editingSessionId.value = null
  editingTitle.value = ''
}

function cancelEditing() {
  editingSessionId.value = null
  editingTitle.value = ''
}

function getLastMessage(session: any): string {
  if (!session.messages?.length) return ''
  const lastMsg = session.messages[session.messages.length - 1]
  if (!lastMsg) return ''
  const content = lastMsg.content.slice(0, 30)
  return `${content}${lastMsg.content.length > 30 ? '...' : ''}`
}

function requestDelete(sessionId: string) {
  sessionToDelete.value = sessionId
  showDeleteDialog.value = true
}

function handleInputKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

const TEXTAREA_MAX_H = 120

function autoResizeTextarea() {
  const el = inputRef.value
  if (!el) return
  // 按内容是否换行决定：单行不设内联 height，交给 CSS；多行再按 scrollHeight 设
  const isSingleLine = !inputText.value.includes('\n')
  if (isSingleLine) {
    el.style.height = ''
    el.style.overflowY = 'hidden'
    return
  }
  el.style.height = '0'
  const sh = el.scrollHeight
  const next = Math.min(sh, TEXTAREA_MAX_H)
  el.style.height = `${next}px`
  el.style.overflowY = next >= TEXTAREA_MAX_H ? 'auto' : 'hidden'
}

async function handleSend() {
  const text = inputText.value?.trim()
  if (!text || loading.value) return

  chatStore.addMessage('user', text)
  inputText.value = ''
  loading.value = true
  nextTick(() => {
    scrollToBottom()
    if (inputRef.value) {
      inputRef.value.style.height = ''
      inputRef.value.style.overflowY = 'hidden'
    }
  })

  try {
    const reply = await sendChatMessage(text)
    chatStore.addMessage('assistant', reply)
  } catch (e) {
    chatStore.addMessage('assistant', `抱歉，请求失败：${e instanceof Error ? e.message : '未知错误'}`)
  } finally {
    loading.value = false
    nextTick(scrollToBottom)
  }
}

function handleSuggestionClick(suggestion: typeof suggestions[0]) {
  inputText.value = suggestion.text
  handleSend()
}

function handleNewSession() {
  chatStore.createSession()
  nextTick(scrollToBottom)
}

function confirmDelete() {
  if (sessionToDelete.value) {
    chatStore.deleteSession(sessionToDelete.value)
    if (!chatStore.currentSessionId && chatStore.sortedSessions.length > 0) {
      chatStore.switchSession(chatStore.sortedSessions[0].id)
    }
    sessionToDelete.value = null
  }
  showDeleteDialog.value = false
}

function scrollToBottom() {
  if (messageListRef.value) {
    messageListRef.value.scrollTo({ top: messageListRef.value.scrollHeight, behavior: 'smooth' })
  }
}

function formatTime(timestamp: number | undefined | null): string {
  const t = timestamp != null ? Number(timestamp) : NaN
  if (!Number.isFinite(t)) return '刚刚'
  const now = Date.now()
  const diff = now - t
  const minute = 60_000
  const hour = 3_600_000
  const day = 86_400_000
  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)}m`
  if (diff < day) return `${Math.floor(diff / hour)}h`
  const date = new Date(t)
  if (Number.isNaN(date.getTime())) return '刚刚'
  const nowDate = new Date(now)
  if (date.getDate() === nowDate.getDate()) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }
  return `${date.getMonth() + 1}/${date.getDate()}`
}
</script>

<style lang="scss" scoped>
/* ===================== 布局 ===================== */
.chat-view {
  height: 100%;
  display: flex;
  background: var(--u-background-1);
  color: var(--u-text-1);
  overflow: hidden;
  position: relative;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* ===================== 消息列表 ===================== */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 2rem 0;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: transparent; border-radius: 2px; }
  &:hover::-webkit-scrollbar-thumb { background: var(--u-border-2); }
}

.chat-messages-list {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}

/* ===================== 空状态 ===================== */
.chat-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  animation: fade-in 0.5s ease;
  box-sizing: border-box;

  &__logo { position: relative; margin-bottom: 2.4rem; }

  &__icon-wrap {
    width: 80px; height: 80px; border-radius: 24px;
    background: linear-gradient(135deg, var(--u-primary), var(--u-primary-light-2));
    display: flex; align-items: center; justify-content: center;
    position: relative; z-index: 2;
    box-shadow: 0 12px 32px -8px var(--u-primary-light-4);
  }
  &__icon { font-size: 40px; color: #fff; }
  &__glow {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
    width: 120px; height: 120px; background: var(--u-primary);
    opacity: 0.15; filter: blur(40px); border-radius: 50%; z-index: 1;
  }

  &__title {
    font-size: 2.4rem; font-weight: 700; margin-bottom: 0.8rem;
    background: linear-gradient(to right, var(--u-text-1), var(--u-text-3));
    background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  &__desc { font-size: 1.6rem; color: var(--u-text-3); margin-bottom: 4rem; }

  &__suggestions {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 1.2rem; width: 100%; max-width: 600px;
  }
  &__suggestion {
    padding: 1.6rem; background: var(--u-background-2);
    border: 1px solid var(--u-border-1); border-radius: 1.6rem;
    cursor: pointer; display: flex; align-items: center; gap: 1.2rem;
    transition: all 0.3s cubic-bezier(0.25,0.8,0.25,1);
    &:hover {
      border-color: var(--u-primary-light-5); background: var(--u-background-1);
      transform: translateY(-2px); box-shadow: 0 8px 24px -12px rgba(0,0,0,0.1);
    }
  }
  &__suggestion-icon-wrap {
    width: 36px; height: 36px; border-radius: 10px;
    background: var(--u-background-3); display: flex;
    align-items: center; justify-content: center;
    color: var(--u-text-2); transition: all 0.3s ease;
  }
  &__suggestion:hover &__suggestion-icon-wrap {
    background: var(--u-primary-light-9); color: var(--u-primary);
  }
  &__suggestion-text { font-size: 1.4rem; color: var(--u-text-2); font-weight: 500; }
}

/* ===================== 消息气泡 ===================== */
.chat-message {
  display: flex; gap: 1.6rem;

  &--user {
    flex-direction: row-reverse;
    .chat-message__content { align-items: flex-end; }
    .chat-message__bubble {
      background: linear-gradient(135deg, var(--u-primary), var(--u-primary-light-1));
      color: #fff; border-radius: 1.6rem 0.4rem 1.6rem 1.6rem;
      box-shadow: 0 4px 12px -4px var(--u-primary-light-4);
    }
    .chat-message__meta { flex-direction: row-reverse; }
  }
  &--assistant .chat-message__bubble {
    background: var(--u-background-2); border: 1px solid var(--u-border-1);
    color: var(--u-text-1); border-radius: 0.4rem 1.6rem 1.6rem 1.6rem;
  }

  &__avatar {
    width: 40px; height: 40px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 1.6rem;
    background: var(--u-background-2); border: 1px solid var(--u-border-1);
    color: var(--u-text-2); margin-top: 2px;
  }
  &--user &__avatar {
    background: var(--u-primary-light-9); color: var(--u-primary);
    border-color: var(--u-primary-light-7);
  }

  &__content { flex: 1; max-width: 80%; display: flex; flex-direction: column; gap: 0.6rem; }
  &__meta { display: flex; align-items: center; gap: 0.8rem; font-size: 1.2rem; color: var(--u-text-4); padding: 0 0.4rem; }
  &__name { font-weight: 600; color: var(--u-text-2); }
  &__bubble { padding: 1.2rem 1.6rem; font-size: 1.5rem; line-height: 1.6; word-break: break-word; &--loading { padding: 1.6rem 2rem; } }
  &__text { white-space: pre-wrap; }
}

/* ===================== 输入区 ===================== */
.chat-input-container {
  width: 100%; max-width: 800px; margin: 0 auto;
  padding: 0 2rem 2rem; box-sizing: border-box;
}

.chat-input-bar {
  display: flex;
  align-items: flex-end;
  background: var(--u-background-2);
  border: 1px solid var(--u-border-1);
  border-radius: 2.4rem;
  padding: 0.6rem 0.6rem 0.6rem 1.8rem;
  gap: 0.8rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus-within {
    border-color: var(--u-primary);
    box-shadow: 0 0 0 3px var(--u-primary-light-8);
  }

  &__textarea {
    flex: 1; min-width: 0;
    background: transparent; border: none; outline: none;
    font-size: 1.4rem; color: var(--u-text-1);
    font-family: inherit;
    resize: none;
    overflow-y: hidden;
    line-height: 2.4rem;
    height: 2.4rem;
    max-height: 12rem;
    padding: 0.6rem 0;
    &::placeholder { color: var(--u-text-4); }
    &:disabled { cursor: not-allowed; opacity: 0.5; }
  }

  &__send {
    width: 3.6rem; height: 3.6rem; border-radius: 50%;
    border: none; cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: var(--u-background-3); color: var(--u-text-4);
    transition: all 0.2s ease;
    font-size: 1.4rem;

    &.is-active {
      background: var(--u-primary); color: #fff;
      &:hover { filter: brightness(1.1); transform: scale(1.05); }
      &:active { transform: scale(0.95); }
    }
    &:disabled { cursor: not-allowed; }
  }
}

.chat-input-hint {
  text-align: center; font-size: 1.1rem;
  color: var(--u-text-4); margin-top: 0.8rem;
}

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }

/* ===================== 侧栏 ===================== */
.chat-sidebar {
  width: 280px; flex-shrink: 0;
  background: var(--u-background-2);
  border-left: 1px solid var(--u-border-1);
  display: flex; flex-direction: column;
  position: relative;
  transition: width 0.3s ease, opacity 0.3s ease;
  overflow: hidden;

  &--collapsed {
    width: 0;
    border-left: none;
    opacity: 0;
  }
}

/* 折叠按钮 */
.sidebar-toggle {
  width: 16px; height: 48px;
  flex-shrink: 0; align-self: center;
  border: 1px solid var(--u-border-1);
  border-radius: 8px 0 0 8px;
  border-right: none;
  background: var(--u-background-2);
  color: var(--u-text-4);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem;
  padding: 0;
  transition: color 0.2s, background 0.2s;

  &:hover { color: var(--u-primary); background: var(--u-background-3); }
}

.chat-sidebar__header {
  padding: 2rem; display: flex; align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--u-border-1);
}

.chat-sidebar__title-area {
  display: flex; align-items: center; gap: 0.8rem;
  font-weight: 600; font-size: 1.6rem;
}

.chat-new-btn {
  width: 32px; height: 32px; border-radius: 8px;
  border: 1px solid var(--u-border-1);
  background: var(--u-background-1); color: var(--u-text-2);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s ease;
  &:hover { border-color: var(--u-primary); color: var(--u-primary); background: var(--u-primary-light-9); }
}

.chat-sidebar__content {
  flex: 1; overflow-y: auto; padding: 0.8rem;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: transparent; border-radius: 2px; }
  &:hover::-webkit-scrollbar-thumb { background: var(--u-border-2); }
}

.chat-sidebar__empty {
  padding: 4rem 2rem; text-align: center;
  display: flex; flex-direction: column; align-items: center;
  gap: 1.2rem; color: var(--u-text-4);
}
.chat-sidebar__empty-icon { font-size: 3.2rem; opacity: 0.3; }

/* ===================== 会话列表 ===================== */
.session-list { display: flex; flex-direction: column; gap: 0.4rem; }

.session-item {
  padding: 1.2rem; border-radius: 12px;
  cursor: pointer; position: relative;
  border: 1px solid transparent;
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    background: var(--u-background-3);
    .session-item__actions { opacity: 1; }
  }

  &--active {
    background: var(--u-background-1);
    &::before {
      content: ''; position: absolute; left: 0; top: 12px; bottom: 12px;
      width: 3px; background: var(--u-primary); border-radius: 0 3px 3px 0;
    }
    .session-item__title { color: var(--u-primary); font-weight: 600; }
  }
}

.session-item__head {
  display: flex; justify-content: space-between; align-items: center;
  gap: 0.8rem; margin-bottom: 0.4rem;
}

.session-item__title {
  flex: 1; min-width: 0; font-size: 1.4rem; color: var(--u-text-1);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.session-item__edit-input {
  width: 100%; border: none; background: var(--u-background-3);
  padding: 2px 4px; border-radius: 4px; font-size: 1.4rem;
  color: var(--u-text-1); outline: 2px solid var(--u-primary);
}

.session-item__time { font-size: 1.1rem; color: var(--u-text-4); flex-shrink: 0; }

.session-item__foot {
  display: flex; align-items: center; justify-content: space-between;
  gap: 0.8rem;
}

.session-item__preview {
  flex: 1; min-width: 0;
  font-size: 1.2rem; color: var(--u-text-3);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  line-height: 1.4;
}

.session-item__actions {
  display: flex; gap: 0.4rem;
  opacity: 0; transition: opacity 0.2s;
  flex-shrink: 0;
}

.session-action-btn {
  width: 24px; height: 24px; border-radius: 6px;
  border: none; background: transparent;
  color: var(--u-text-4); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s ease;

  &:hover { color: var(--u-primary); background: var(--u-primary-light-9); }
  &--danger:hover { color: var(--u-danger); background: var(--u-danger-light-9); }
}

/* ===================== 删除弹窗 ===================== */
.delete-confirm {
  display: flex; gap: 2rem; padding: 1rem 0;
  &__icon {
    width: 48px; height: 48px; border-radius: 50%;
    background: var(--u-danger-light-9); color: var(--u-danger);
    display: flex; align-items: center; justify-content: center;
    font-size: 2rem; flex-shrink: 0;
  }
  &__body {
    h3 { font-size: 1.8rem; margin: 0 0 0.8rem; color: var(--u-text-1); }
    p { font-size: 1.4rem; color: var(--u-text-3); margin: 0; line-height: 1.5; }
  }
}

/* ===================== 动画 ===================== */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.typing-indicator {
  display: flex; gap: 4px;
  span {
    width: 6px; height: 6px; background: var(--u-text-3);
    border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both;
    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }
}
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* ===================== 响应式 ===================== */
@media (max-width: 768px) {
  .chat-sidebar, .sidebar-toggle { display: none; }
  .chat-messages-list { padding: 0 1.6rem; }
  .chat-input-container { padding: 0 1.6rem 1.6rem; }
  .chat-empty__suggestions { grid-template-columns: 1fr; }
}
</style>
