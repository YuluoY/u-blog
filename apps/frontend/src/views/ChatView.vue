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
            <u-text class="chat-empty__title">{{ t('chat.title') }}</u-text>
            <u-text class="chat-empty__desc">{{ t('chat.emptyDesc') }}</u-text>
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
        <TransitionGroup v-else name="message" tag="div" class="chat-messages-list" :style="{ '--chat-font-size': chatFontSize / 10 + 'rem' }">
          <div
            v-for="message in chatStore.currentMessages"
            :key="message.id"
            :class="['chat-message', `chat-message--${message.role}`]"
          >
            <div class="chat-message__avatar">
              <!-- 用户消息：显示真实头像或随机访客头像 -->
              <template v-if="message.role === 'user'">
                <img v-if="userStore.user?.avatar" :src="userStore.user.avatar" alt="avatar" class="chat-message__avatar-img" />
                <img v-else :src="guestAvatarUrl" alt="guest-avatar" class="chat-message__avatar-img" />
              </template>
              <!-- AI 消息：机器人图标 -->
              <u-icon v-else icon="fa-solid fa-robot" />
            </div>
            <div class="chat-message__content">
              <div class="chat-message__meta">
                <span class="chat-message__name">{{ message.role === 'user' ? (userStore.user?.namec || userStore.user?.username || t('chat.you')) : t('chat.title') }}</span>
                <span class="chat-message__time">{{ formatTime(message.timestamp) }}</span>
              </div>
              <div class="chat-message__bubble">
                <!-- 用户消息：纯文本 -->
                <div v-if="message.role === 'user'" class="chat-message__text">
                  {{ message.content }}
                </div>
                <!-- 助手消息：Markdown 渲染 + 代码高亮 -->
                <div v-else class="chat-message__text chat-message__text--md">
                  <MarkdownPreview
                    :content="normalizeStreamingMarkdown(message.content, streaming && isLastMessage(message))"
                    :code-foldable="false"
                  />
                  <span
                    v-if="streaming && isLastMessage(message)"
                    class="chat-message__cursor"
                  />
                </div>
              </div>
            </div>
          </div>
          <!-- 等待首个 token 前的加载指示器 -->
          <div v-if="loading && !streaming" key="loading" class="chat-message chat-message--assistant">
            <div class="chat-message__avatar">
              <u-icon icon="fa-solid fa-robot" />
            </div>
            <div class="chat-message__content">
              <div class="chat-message__meta">
                <span class="chat-message__name">{{ t('chat.title') }}</span>
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
        <!-- 模型调参浮层 -->
        <Transition name="popover-fade">
          <div v-if="showModelPopover" class="model-popover" @click.stop>
            <div class="model-popover__header">
              <u-icon icon="fa-solid fa-sliders" />
              <span>{{ t('chat.modelSettings') }}</span>
            </div>
            <div class="model-popover__body">
              <!-- 温度 -->
              <div class="model-popover__field">
                <div class="model-popover__label">
                  <span>{{ t('chat.temperature') }}</span>
                  <span class="model-popover__value">{{ chatModelParams.temperature.toFixed(1) }}</span>
                </div>
                <u-slider v-model="chatModelParams.temperature" :min="0" :max="2" :step="0.1" />
              </div>
              <!-- 最大输出（对数刻度，覆盖 256 ~ 1M） -->
              <div class="model-popover__field">
                <div class="model-popover__label">
                  <span>{{ t('chat.maxTokens') }}</span>
                  <span class="model-popover__value">{{ formatTokenCount(chatModelParams.maxTokens) }}</span>
                </div>
                <u-slider v-model="maxTokensStep" :min="0" :max="12" :step="1" />
              </div>
              <!-- 上下文数 -->
              <div class="model-popover__field">
                <div class="model-popover__label">
                  <span>{{ t('chat.contextLength') }}</span>
                  <span class="model-popover__value">{{ chatModelParams.contextLength }}</span>
                </div>
                <u-slider v-model="chatModelParams.contextLength" :min="1" :max="50" :step="1" />
              </div>
              <!-- 字号大小 -->
              <div class="model-popover__field">
                <div class="model-popover__label">
                  <span>{{ t('chat.fontSize') }}</span>
                  <span class="model-popover__value">{{ chatFontSize }}px</span>
                </div>
                <u-slider v-model="chatFontSize" :min="12" :max="20" :step="1" />
              </div>
            </div>
            <!-- 游客模式下隐藏设置保存操作 -->
            <div v-if="!isGuestChat" class="model-popover__footer">
              <button class="model-popover__link" @click="openFullSettings">
                <u-icon icon="fa-solid fa-gear" />
                <span>{{ t('chat.moreSettings') }}</span>
              </button>
              <u-button type="primary" size="small" :loading="savingParams" @click="saveModelParams">
                <u-icon icon="fa-solid fa-check" />
              </u-button>
            </div>
          </div>
        </Transition>

        <div class="chat-input-bar">
          <textarea
            ref="inputRef"
            id="chat-message-input"
            name="chat-message"
            v-model="inputText"
            class="chat-input-bar__textarea"
            :placeholder="t('chat.placeholder')"
            :disabled="loading"
            rows="1"
            @keydown="handleInputKeydown"
            @input="autoResizeTextarea"
          ></textarea>
          <!-- 模型设置按钮 -->
          <button
            class="chat-input-bar__settings"
            :class="{ 'is-active': showModelPopover }"
            :title="t('chat.modelSettings')"
            @click.stop="showModelPopover = !showModelPopover"
          >
            <u-icon icon="fa-solid fa-sliders" />
          </button>
          <!-- RAG 上下文检索开关（记忆功能） -->
          <button
            class="chat-input-bar__rag"
            :class="{ 'is-active': ragEnabled }"
            :title="t('chat.memory')"
            @click.stop="ragEnabled = !ragEnabled"
          >
            <u-icon icon="fa-solid fa-brain" />
          </button>
          <!-- 发送 / 停止按钮 -->
          <button
            v-if="loading"
            class="chat-input-bar__stop"
            @click="handleStop"
            :title="t('chat.stop')"
          >
            <u-icon icon="fa-solid fa-stop" />
          </button>
          <button
            v-else
            class="chat-input-bar__send"
            :class="{ 'is-active': inputText.trim() }"
            :disabled="!inputText.trim()"
            @click="handleSend"
          >
            <u-icon icon="fa-solid fa-arrow-up" />
          </button>
        </div>
        <div class="chat-input-hint">{{ t('chat.hint') }}</div>
      </div>
    </div>

    <!-- 侧栏折叠按钮（独立于侧栏，不受 overflow 影响） -->
    <button
      class="sidebar-toggle"
      @click="sidebarVisible = !sidebarVisible"
      :title="sidebarVisible ? t('chat.collapseSidebar') : t('chat.expandSidebar')"
    >
      <u-icon :icon="sidebarVisible ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left'" />
    </button>

    <!-- 右侧：历史会话侧栏 -->
    <aside class="chat-sidebar" :class="{ 'chat-sidebar--collapsed': !sidebarVisible }">
        <div class="chat-sidebar__header">
          <div class="chat-sidebar__title-area">
            <u-icon icon="fa-solid fa-history" />
            <span>{{ t('chat.history') }}</span>
          </div>
          <div class="chat-sidebar__header-actions">
            <button class="chat-new-btn" @click="handleCreateFolder" :title="t('chat.newFolder')">
              <u-icon icon="fa-solid fa-folder-plus" />
            </button>
            <button class="chat-new-btn" @click="handleNewSession" :title="t('chat.newChat')">
              <u-icon icon="fa-solid fa-plus" />
            </button>
          </div>
        </div>
        
        <div class="chat-sidebar__content">
          <template v-if="chatStore.sortedSessions.length === 0 && chatStore.sortedFolders.length === 0">
            <div class="chat-sidebar__empty">
              <u-icon icon="fa-solid fa-comments" class="chat-sidebar__empty-icon" />
              <span>{{ t('chat.noHistory') }}</span>
            </div>
          </template>
          <template v-else>
            <!-- 文件夹分组 -->
            <div
              v-for="folder in chatStore.sortedFolders"
              :key="folder.id"
              class="folder-group"
            >
              <div class="folder-header" @click="toggleFolder(folder.id)">
                <u-icon :icon="isFolderOpen(folder.id) ? 'fa-solid fa-folder-open' : 'fa-solid fa-folder'" class="folder-header__icon" />
                <span class="folder-header__name" @dblclick.stop="startFolderEditing(folder)">
                  <template v-if="editingFolderId !== folder.id">{{ folder.name }}</template>
                  <input
                    v-else
                    v-model="editingFolderName"
                    class="folder-header__edit-input"
                    @blur="finishFolderEditing"
                    @keydown.enter.prevent="finishFolderEditing"
                    @keydown.esc="cancelFolderEditing"
                    @click.stop
                  />
                </span>
                <span class="folder-header__count">{{ chatStore.getSessionsByFolder(folder.id).length }}</span>
                <div class="folder-header__actions" @click.stop>
                  <button class="session-action-btn" :title="t('chat.newChat')" @click="handleNewSessionInFolder(folder.id)">
                    <u-icon icon="fa-solid fa-plus" />
                  </button>
                  <button class="session-action-btn session-action-btn--danger" :title="t('chat.deleteFolder')" @click="handleDeleteFolder(folder.id)">
                    <u-icon icon="fa-solid fa-trash" />
                  </button>
                </div>
              </div>
              <div v-show="isFolderOpen(folder.id)" class="folder-sessions">
                <div
                  v-for="session in chatStore.getSessionsByFolder(folder.id)"
                  :key="session.id"
                  :class="['session-item', { 'session-item--active': session.id === chatStore.currentSessionId }]"
                  @click="handleSessionClick(session.id)"
                >
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
                  <div class="session-item__foot">
                    <span class="session-item__preview">{{ getLastMessage(session) || t('chat.newSession') }}</span>
                    <div class="session-item__actions" @click.stop>
                      <!-- 移到其他文件夹下拉 -->
                      <div v-if="chatStore.sortedFolders.length > 1" class="session-move-dropdown">
                        <button class="session-action-btn" :title="t('chat.moveToFolder')" @click.stop="toggleMoveMenu(session.id)">
                          <u-icon icon="fa-solid fa-file-arrow-down" />
                        </button>
                        <div v-if="moveMenuSessionId === session.id" class="session-move-dropdown__menu" @click.stop>
                          <button
                            v-for="f in chatStore.sortedFolders.filter(f => f.id !== folder.id)"
                            :key="f.id"
                            class="session-move-dropdown__item"
                            @click="handleMoveToFolder(session.id, f.id)"
                          >
                            <u-icon icon="fa-solid fa-folder" />
                            {{ f.name }}
                          </button>
                        </div>
                      </div>
                      <button class="session-action-btn" :title="t('chat.removeFromFolder')" @click="chatStore.moveSessionToFolder(session.id, null)">
                        <u-icon icon="fa-solid fa-arrow-right-from-bracket" />
                      </button>
                      <button class="session-action-btn session-action-btn--danger" :title="t('common.delete')" @click="requestDelete(session.id)">
                        <u-icon icon="fa-solid fa-trash" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 分隔线（仅当有文件夹且有未分类会话时显示） -->
            <div v-if="chatStore.sortedFolders.length > 0 && chatStore.uncategorizedSessions.length > 0" class="sidebar-divider">
              <span>{{ t('chat.uncategorized') }}</span>
            </div>

            <!-- 未分类会话 -->
            <div class="session-list">
              <div
                v-for="session in chatStore.uncategorizedSessions"
                :key="session.id"
                :class="['session-item', { 'session-item--active': session.id === chatStore.currentSessionId }]"
                @click="handleSessionClick(session.id)"
              >
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
                <div class="session-item__foot">
                  <span class="session-item__preview">{{ getLastMessage(session) || t('chat.newSession') }}</span>
                  <div class="session-item__actions" @click.stop>
                    <!-- 移到文件夹下拉 -->
                    <div v-if="chatStore.sortedFolders.length > 0" class="session-move-dropdown">
                      <button class="session-action-btn" :title="t('chat.moveToFolder')" @click.stop="toggleMoveMenu(session.id)">
                        <u-icon icon="fa-solid fa-file-arrow-down" />
                      </button>
                      <div v-if="moveMenuSessionId === session.id" class="session-move-dropdown__menu" @click.stop>
                        <button
                          v-for="folder in chatStore.sortedFolders"
                          :key="folder.id"
                          class="session-move-dropdown__item"
                          @click="handleMoveToFolder(session.id, folder.id)"
                        >
                          <u-icon icon="fa-solid fa-folder" />
                          {{ folder.name }}
                        </button>
                      </div>
                    </div>
                    <button class="session-action-btn" :title="t('chat.rename')" @click="startEditing(session)">
                      <u-icon icon="fa-solid fa-pen" />
                    </button>
                    <button class="session-action-btn session-action-btn--danger" :title="t('common.delete')" @click="requestDelete(session.id)">
                      <u-icon icon="fa-solid fa-trash" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </aside>

    <!-- 删除确认对话框 -->
    <u-dialog
      v-model="showDeleteDialog"
      :title="t('chat.deleteSession')"
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
          <h3>{{ t('chat.confirmDelete') }}</h3>
          <p>{{ t('chat.deleteWarning') }}</p>
        </div>
      </div>
    </u-dialog>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { UMessageFn, getRandomAvatarUrl } from '@u-blog/ui'
import { sendChatMessageStream } from '@/api/chat'
import type { ChatMessagePayload } from '@/api/chat'
import { getSettings, updateSettings } from '@/api/settings'
import { SETTING_KEYS } from '@/constants/settings'
import { STORAGE_KEYS } from '@/constants/storage'
import { useChatStore } from '@/stores/chat'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/model/user'
import { useBlogOwnerStore } from '@/stores/blogOwner'
import { useChatRAG } from '@/composables/useChatRAG'
import MarkdownPreview from '@/components/MarkdownPreview.vue'
import { normalizeStreamingMarkdown } from '@/utils/markdownStreaming'

defineOptions({ name: 'ChatView' })

const { t } = useI18n()
const chatStore = useChatStore()
const appStore = useAppStore()
const userStore = useUserStore()
const blogOwnerStore = useBlogOwnerStore()
const { search: ragSearch, formatContext } = useChatRAG()
const inputText = ref('')
const inputRef = ref<HTMLTextAreaElement | null>(null)
const loading = ref(false)

/** 游客随机头像（基于用户名或 "guest" 生成确定性头像） */
const guestAvatarUrl = computed(() =>
{
  const seed = userStore.user?.namec || userStore.user?.username || 'guest'
  return getRandomAvatarUrl(seed)
})

/** 正在流式接收 token（用于显示光标闪烁效果） */
const streaming = ref(false)
/** 用于取消正在进行的 SSE 请求 */
let abortController: AbortController | null = null
const messageListRef = ref<HTMLElement | null>(null)
const showDeleteDialog = ref(false)
const sessionToDelete = ref<string | null>(null)
const editingSessionId = ref<string | null>(null)
const editingTitle = ref('')
/** RAG 上下文检索开关 */
const ragEnabled = ref(true)

/** 是否为游客模式（子域名完整模式下未登录） */
const isGuestChat = computed(() =>
  blogOwnerStore.isSubdomainMode && !blogOwnerStore.isReadOnly && !userStore.isLoggedIn,
)

/* ===================== 文件夹管理 ===================== */
const folderOpenMap = ref<Record<string, boolean>>(loadFolderOpenState())
const editingFolderId = ref<string | null>(null)
const editingFolderName = ref('')
const moveMenuSessionId = ref<string | null>(null)

function loadFolderOpenState(): Record<string, boolean>
{
  try
  {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT_FOLDERS_OPEN)
    return raw ? JSON.parse(raw) : {}
  }
  catch
  {
    return {}
  }
}

function saveFolderOpenState()
{
  try
  {
    localStorage.setItem(STORAGE_KEYS.CHAT_FOLDERS_OPEN, JSON.stringify(folderOpenMap.value))
  }
  catch
  { /* ignore */ }
}

function isFolderOpen(folderId: string): boolean
{
  return folderOpenMap.value[folderId] !== false // 默认展开
}

function toggleFolder(folderId: string)
{
  folderOpenMap.value[folderId] = !isFolderOpen(folderId)
  saveFolderOpenState()
}

function handleCreateFolder()
{
  const name = t('chat.newFolder')
  const id = chatStore.createFolder(name)
  // 自动进入重命名状态
  editingFolderId.value = id
  editingFolderName.value = name
  nextTick(() =>
  {
    const input = document.querySelector('.folder-header__edit-input') as HTMLInputElement
    input?.focus()
    input?.select()
  })
}

function startFolderEditing(folder: { id: string; name: string })
{
  editingFolderId.value = folder.id
  editingFolderName.value = folder.name
  nextTick(() =>
  {
    const input = document.querySelector('.folder-header__edit-input') as HTMLInputElement
    input?.focus()
    input?.select()
  })
}

function finishFolderEditing()
{
  if (editingFolderId.value && editingFolderName.value.trim())
  
    chatStore.renameFolderById(editingFolderId.value, editingFolderName.value.trim())
  
  editingFolderId.value = null
  editingFolderName.value = ''
}

function cancelFolderEditing()
{
  editingFolderId.value = null
  editingFolderName.value = ''
}

function handleDeleteFolder(folderId: string)
{
  chatStore.deleteFolderById(folderId)
}

function toggleMoveMenu(sessionId: string)
{
  moveMenuSessionId.value = moveMenuSessionId.value === sessionId ? null : sessionId
}

function handleMoveToFolder(sessionId: string, folderId: string)
{
  chatStore.moveSessionToFolder(sessionId, folderId)
  moveMenuSessionId.value = null
}

/* ===================== 最大输出 Token 对数刻度 ===================== */

/** 对数刻度步进值：2^8=256 至 2^20=1048576 */
const TOKEN_STEPS = [256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576]

const maxTokensStep = computed({
  get: () =>
  {
    const idx = TOKEN_STEPS.findIndex(v => v >= chatModelParams.maxTokens)
    return idx === -1 ? TOKEN_STEPS.length - 1 : idx
  },
  set: (v: number) =>
  {
    chatModelParams.maxTokens = TOKEN_STEPS[Math.min(v, TOKEN_STEPS.length - 1)]
  },
})

/** 格式化 token 数量显示：1024→"1K", 131072→"128K", 1048576→"1M" */
function formatTokenCount(n: number): string
{
  if (n >= 1_000_000) return `${(n / 1_000_000)}M`
  if (n >= 1000) return `${Math.round(n / 1000)}K`
  return String(n)
}

/* ===================== 模型调参浮层 ===================== */
const showModelPopover = ref(false)
const savingParams = ref(false)
const chatModelParams = reactive({
  temperature: 0.7,
  maxTokens: 2048,
  contextLength: 20,
})

/* ===================== 字号大小（用户级设置，API + localStorage 双写） ===================== */
const chatFontSize = ref(loadChatFontSize())

/** 从 localStorage 快速读取（页面打开时即刻生效，不等待 API） */
function loadChatFontSize(): number
{
  try
  {
    const v = localStorage.getItem(STORAGE_KEYS.CHAT_FONT_SIZE)
    const n = v ? Number(v) : NaN
    return (Number.isFinite(n) && n >= 12 && n <= 20) ? n : 15
  }
  catch
  {
    return 15
  }
}

/** 从后端加载用户级字号设置，覆盖 localStorage 缓存 */
async function loadChatFontSizeFromServer()
{
  try
  {
    const data = await getSettings([SETTING_KEYS.CHAT_FONT_SIZE])
    const val = data[SETTING_KEYS.CHAT_FONT_SIZE]?.value
    if (val != null)
    {
      const n = Number(val)
      if (Number.isFinite(n) && n >= 12 && n <= 20)
      {
        chatFontSize.value = n
        localStorage.setItem(STORAGE_KEYS.CHAT_FONT_SIZE, String(n))
      }
    }
  }
  catch
  { /* 静默，使用 localStorage 缓存 */ }
}

watch(chatFontSize, v =>
{
  try
  {
    localStorage.setItem(STORAGE_KEYS.CHAT_FONT_SIZE, String(v))
  }
  catch
  { /* ignore */ }
})

/** 从 localStorage 读取本地模型参数 */
function loadLocalModelParams(): Partial<typeof chatModelParams>
{
  try
  {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT_MODEL_PARAMS)
    return raw ? JSON.parse(raw) : {}
  }
  catch
  {
    return {}
  }
}

/** 将模型参数持久化到 localStorage */
function saveLocalModelParams()
{
  localStorage.setItem(
    STORAGE_KEYS.CHAT_MODEL_PARAMS,
    JSON.stringify({
      temperature: chatModelParams.temperature,
      maxTokens: chatModelParams.maxTokens,
      contextLength: chatModelParams.contextLength,
    }),
  )
}

/** 加载模型参数：优先 localStorage（个人偏好），再用服务端默认值兜底 */
async function loadModelParams()
{
  // 1. 先从服务端拉取默认值
  try
  {
    const keys = [
      SETTING_KEYS.OPENAI_TEMPERATURE,
      SETTING_KEYS.OPENAI_MAX_TOKENS,
      SETTING_KEYS.OPENAI_CONTEXT_LENGTH,
    ]
    const data = await getSettings(keys)
    const temp = data[SETTING_KEYS.OPENAI_TEMPERATURE]?.value
    if (temp != null) chatModelParams.temperature = Number(temp) || 0.7
    const max = data[SETTING_KEYS.OPENAI_MAX_TOKENS]?.value
    if (max != null) chatModelParams.maxTokens = Number(max) || 2048
    const ctx = data[SETTING_KEYS.OPENAI_CONTEXT_LENGTH]?.value
    if (ctx != null) chatModelParams.contextLength = Number(ctx) || 20
  }
  catch
  { /* 静默 */ }

  // 2. 本地偏好覆盖服务端默认值
  const local = loadLocalModelParams()
  if (local.temperature != null) chatModelParams.temperature = local.temperature
  if (local.maxTokens != null) chatModelParams.maxTokens = local.maxTokens
  if (local.contextLength != null) chatModelParams.contextLength = local.contextLength
}

/** 保存模型参数：保存到 localStorage 并同步到服务端（包含字号） */
async function saveModelParams()
{
  // 游客禁止写入服务端设置
  if (isGuestChat.value) return
  savingParams.value = true
  try
  {
    // 保存到 localStorage（本地快速恢复）
    saveLocalModelParams()
    // 同步到服务端（用户级隔离）
    await updateSettings({
      [SETTING_KEYS.OPENAI_TEMPERATURE]: { value: chatModelParams.temperature },
      [SETTING_KEYS.OPENAI_MAX_TOKENS]: { value: chatModelParams.maxTokens },
      [SETTING_KEYS.OPENAI_CONTEXT_LENGTH]: { value: chatModelParams.contextLength },
      [SETTING_KEYS.CHAT_FONT_SIZE]: { value: chatFontSize.value },
    })
    showModelPopover.value = false
  }
  catch (err: any)
  {
    UMessageFn({ message: err?.message || t('chat.saveParamsFailed'), type: 'error' })
  }
  finally
  {
    savingParams.value = false
  }
}

/** 关闭浮层并打开设置抽屉（游客不可用） */
function openFullSettings()
{
  if (isGuestChat.value) return
  showModelPopover.value = false
  appStore.setSettingsDrawerVisible(true)
}

/** 点击外部关闭浮层 */
function onDocumentClick()
{
  if (showModelPopover.value) showModelPopover.value = false
}

onMounted(() =>
{
  document.addEventListener('click', onDocumentClick)
  loadModelParams()
  loadChatFontSizeFromServer()
})
onUnmounted(() =>
{
  document.removeEventListener('click', onDocumentClick)
})
function loadSidebarVisible(): boolean
{
  try
  {
    const v = localStorage.getItem(STORAGE_KEYS.CHAT_SIDEBAR_VISIBLE)
    if (v === 'true' || v === 'false') return v === 'true'
  }
  catch
  { /* ignore */ }
  return true
}

const sidebarVisible = ref(loadSidebarVisible())

watch(sidebarVisible, val =>
{
  try
  {
    localStorage.setItem(STORAGE_KEYS.CHAT_SIDEBAR_VISIBLE, String(val))
  }
  catch
  { /* ignore */ }
}, { immediate: true })

const suggestions = computed(() => [
  { icon: 'fa-solid fa-pen-nib', text: t('chat.promptWrite') },
  { icon: 'fa-solid fa-code', text: t('chat.promptCode') },
  { icon: 'fa-solid fa-language', text: t('chat.promptTranslate') },
  { icon: 'fa-solid fa-brain', text: t('chat.promptBrainstorm') },
])

onMounted(async() =>
{
  // 等待 IndexedDB 初始化完成，避免与 initFromDB 产生竞态条件
  await chatStore.initReady
  if (!chatStore.currentSessionId && chatStore.sortedSessions.length === 0)
  
    chatStore.createSession()
  
})

function handleSessionClick(sessionId: string)
{
  if (sessionId !== chatStore.currentSessionId)
  {
    chatStore.switchSession(sessionId)
    nextTick(scrollToBottom)
  }
}

function startEditing(session: any)
{
  editingSessionId.value = session.id
  editingTitle.value = session.title
  nextTick(() =>
  {
    const input = document.querySelector('.session-item__edit-input') as HTMLInputElement
    input?.focus()
    input?.select()
  })
}

function finishEditing()
{
  if (editingSessionId.value && editingTitle.value.trim())
  
    chatStore.updateSessionTitle(editingSessionId.value, editingTitle.value.trim())
  
  editingSessionId.value = null
  editingTitle.value = ''
}

function cancelEditing()
{
  editingSessionId.value = null
  editingTitle.value = ''
}

function getLastMessage(session: any): string
{
  if (!session.messages?.length) return ''
  const lastMsg = session.messages[session.messages.length - 1]
  if (!lastMsg) return ''
  const content = lastMsg.content.slice(0, 30)
  return `${content}${lastMsg.content.length > 30 ? '...' : ''}`
}

function requestDelete(sessionId: string)
{
  sessionToDelete.value = sessionId
  showDeleteDialog.value = true
}

function handleInputKeydown(e: KeyboardEvent)
{
  if (e.key === 'Enter' && !e.shiftKey)
  {
    e.preventDefault()
    handleSend()
  }
  // Shift+Enter：浏览器默认行为即插入换行，无需额外处理
  // 在下一帧重新计算高度（处理删除换行后的回缩）
  nextTick(autoResizeTextarea)
}

// border-box 下高度包含 padding（上下各 6px = 12px）
const TEXTAREA_MIN_H = 36  // 24px lineHeight + 12px padding
const TEXTAREA_MAX_H = 132 // 120px maxContent + 12px padding

function autoResizeTextarea()
{
  const el = inputRef.value
  if (!el) return
  // 先重置为最小高度，确保 scrollHeight 反映真实内容高度（而非之前的撑开高度）
  el.style.height = `${TEXTAREA_MIN_H}px`
  const sh = el.scrollHeight
  const next = Math.min(sh, TEXTAREA_MAX_H)
  el.style.height = `${next}px`
  el.style.overflowY = next >= TEXTAREA_MAX_H ? 'auto' : 'hidden'
}

/** 缓存 API Key 是否可用，避免每次发送都请求后端 */
let _apiKeyChecked = false

/**
 * 发送前校验：
 * 1. 路由守卫已处理未登录跳转，这里双重保险
 * 2. 检查是否已配置模型 API Key
 * 3. 子域名游客模式下跳过以上校验（后端通过 blogOwnerId 鉴权并加载博主配置）
 */
async function preSendValidation(): Promise<boolean>
{
  // 子域名完整模式下的游客：跳过登录和 API Key 校验（后端自行验证博主配置）
  const isGuestSubdomainChat =
    blogOwnerStore.isSubdomainMode &&
    !blogOwnerStore.isReadOnly &&
    !userStore.isLoggedIn
  if (isGuestSubdomainChat) return true

  // 登录校验（理论上路由已拦截，这里作为兜底）
  if (!userStore.isLoggedIn)
  {
    UMessageFn({ message: t('chat.notLoggedIn'), type: 'warning' })
    return false
  }
  // API Key 校验（带缓存，只在首次 / 失败时请求）
  if (!_apiKeyChecked)
  {
    try
    {
      const settings = await getSettings([SETTING_KEYS.OPENAI_API_KEY])
      const keyVal = settings[SETTING_KEYS.OPENAI_API_KEY]?.value
      if (!keyVal)
      {
        UMessageFn({ message: t('chat.noApiKey'), type: 'warning' })
        appStore.setSettingsDrawerVisible(true)
        return false
      }
      _apiKeyChecked = true
    }
    catch
    {
      UMessageFn({ message: t('chat.noApiKey'), type: 'warning' })
      return false
    }
  }
  return true
}

async function handleSend()
{
  const text = inputText.value?.trim()
  if (!text || loading.value) return

  // 发送前校验登录 + API Key
  if (!await preSendValidation()) return

  chatStore.addMessage('user', text)
  inputText.value = ''
  loading.value = true
  // 关闭移动菜单
  moveMenuSessionId.value = null
  nextTick(() =>
  {
    scrollToBottom()
    if (inputRef.value)
    {
      inputRef.value.style.height = ''
      inputRef.value.style.overflowY = 'hidden'
    }
  })

  // RAG：从历史会话中检索相关上下文
  let ragContext: string | undefined
  if (ragEnabled.value && chatStore.sessions.length > 1)
  {
    const results = ragSearch(text, chatStore.sessions, {
      excludeSessionId: chatStore.currentSessionId,
      topK: 5,
      minScore: 1.5,
    })
    if (results.length > 0)
    
      ragContext = formatContext(results)
    
  }

  // 构建完整对话历史（传给后端做多轮上下文）
  const payloadMessages: ChatMessagePayload[] = chatStore.currentMessages.map(m => ({
    role: m.role,
    content: m.content,
  }))

  // 先创建一条空的 assistant 消息占位，后续 token 逐个追加
  chatStore.addMessage('assistant', '')
  streaming.value = true

  abortController = new AbortController()

  try
  {
    await sendChatMessageStream(
      payloadMessages,
      token =>
      {
        chatStore.appendToLastMessage(token)
        nextTick(scrollToBottom)
      },
      abortController.signal,
      {
        temperature: chatModelParams.temperature,
        maxTokens: chatModelParams.maxTokens,
      },
      ragContext,
      // 子域名游客场景：传递博主 ID，后端据此加载博主的模型配置并验证权限
      blogOwnerStore.isSubdomainMode && !userStore.isLoggedIn
        ? blogOwnerStore.blogOwnerId
        : undefined,
    )
  }
  catch (e)
  {
    if ((e as Error).name === 'AbortError')
    {
      // 用户手动取消
    }
    else
    {
      const errMsg = `${t('chat.requestFailed')}: ${e instanceof Error ? e.message : t('chat.unknownError')}`
      const last = chatStore.currentMessages[chatStore.currentMessages.length - 1]
      if (last && !last.content)
      
        chatStore.appendToLastMessage(errMsg)
      
      else
      
        chatStore.addMessage('assistant', errMsg)
      
    }
  }
  finally
  {
    streaming.value = false
    loading.value = false
    abortController = null
    chatStore.flushStorage()
    nextTick(scrollToBottom)
  }
}

/** 停止流式生成 */
function handleStop()
{
  if (abortController)
  {
    abortController.abort()
    abortController = null
  }
}

function handleSuggestionClick(suggestion: { icon: string; text: string })
{
  inputText.value = suggestion.text
  handleSend()
}

function handleNewSession()
{
  chatStore.createSession()
  nextTick(scrollToBottom)
}

/** 在指定文件夹中新建会话 */
function handleNewSessionInFolder(folderId: string)
{
  chatStore.createSession(folderId)
  // 确保文件夹处于展开状态
  folderOpenMap.value[folderId] = true
  saveFolderOpenState()
  nextTick(scrollToBottom)
}

function confirmDelete()
{
  if (sessionToDelete.value)
  {
    chatStore.deleteSession(sessionToDelete.value)
    if (!chatStore.currentSessionId && chatStore.sortedSessions.length > 0)
    
      chatStore.switchSession(chatStore.sortedSessions[0].id)
    
    sessionToDelete.value = null
  }
  showDeleteDialog.value = false
}

function scrollToBottom()
{
  if (messageListRef.value)
  
    messageListRef.value.scrollTo({ top: messageListRef.value.scrollHeight, behavior: 'smooth' })
  
}

function formatTime(timestamp: number | undefined | null): string
{
  const ts = timestamp != null ? Number(timestamp) : NaN
  if (!Number.isFinite(ts)) return t('common.justNow')
  const now = Date.now()
  const diff = now - ts
  const minute = 60_000
  const hour = 3_600_000
  const day = 86_400_000
  if (diff < minute) return t('common.justNow')
  if (diff < hour) return `${Math.floor(diff / minute)}m`
  if (diff < day) return `${Math.floor(diff / hour)}h`
  const date = new Date(ts)
  if (Number.isNaN(date.getTime())) return t('common.justNow')
  const nowDate = new Date(now)
  if (date.getDate() === nowDate.getDate())
  
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  
  return `${date.getMonth() + 1}/${date.getDate()}`
}

/** 判断是否为当前会话最后一条消息（用于显示流式光标） */
function isLastMessage(msg: { id: string }): boolean
{
  const msgs = chatStore.currentMessages
  return msgs.length > 0 && msgs[msgs.length - 1].id === msg.id
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
}

.chat-messages-list {
  width: 100%;
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
    background: transparent; border: none;
    color: var(--u-text-1); border-radius: 0;
    padding: 0;
  }
  /* ── 助手 Markdown 内容区（企业级 AI 对话排版） ── */
  &--assistant .chat-message__text--md {
    font-size: var(--chat-font-size, 1.5rem);
    line-height: 1.6;

    :deep(.markdown-preview) {
      font-size: inherit;
    }

    :deep(.md-editor-preview) {
      font-size: inherit;
      line-height: 1.6;

      /* ── 标题 ── */
      h1, h2, h3, h4, h5, h6 {
        margin: 1em 0 0.4em;
        line-height: 1.35;
        font-weight: 600;
      }
      h1 { font-size: 1.4em; }
      h2 { font-size: 1.25em; }
      h3 { font-size: 1.15em; }
      h4 { font-size: 1.05em; }

      /* ── 段落 ── */
      p {
        margin: 0.6em 0;
        font-size: inherit;
        line-height: 1.6;
      }

      /* ── 列表 ── */
      ul, ol {
        margin: 0.6em 0;
        padding-left: 1.5em;
        line-height: 1.6;
      }
      li {
        margin: 0.2em 0;
        line-height: 1.6;
      }
      /* 列表内嵌套段落不额外撑高 */
      li > p { margin: 0.15em 0; }

      /* ── 引用 ── */
      blockquote {
        margin: 0.6em 0;
        line-height: 1.6;
        p { margin: 0.2em 0; }
      }

      /* ── 分隔线 ── */
      hr {
        margin: 0.8em 0;
      }

      /* ── 表格 ── */
      table {
        margin: 0.6em 0;
        width: 100%;
        border-collapse: collapse;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid var(--u-border-1);
        font-size: 0.92em;
      }
      th, td {
        border-color: var(--u-border-1);
        padding: 8px 12px;
      }
      th {
        background: var(--u-background-3) !important;
        color: var(--u-text-1);
        font-weight: 600;
      }
      td {
        color: var(--u-text-2);
      }
      /* 覆盖库默认 stripe（#fafafa 在暗色主题下不可见） */
      tr {
        background-color: transparent !important;
      }
      tr:nth-child(2n) {
        background-color: var(--u-background-2) !important;
      }
      tbody tr:hover {
        background-color: var(--u-background-3) !important;
      }

      /* ── 代码块 ── */
      .md-editor-code {
        margin: 0.75em 0;
      }
      /*
       * 禁用代码块头部 sticky 定位：
       * 库默认 position:sticky;top:0 在聊天滚动容器内会与页面导航栏产生间距
       */
      .md-editor-code .md-editor-code-head {
        position: relative;
        top: auto;
        z-index: auto;
      }

      /* ── 首尾元素去除外边距 ── */
      & > :first-child { margin-top: 0; }
      & > :last-child  { margin-bottom: 0; }
    }
  }

  &__avatar {
    width: 40px; height: 40px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 1.6rem;
    background: var(--u-background-2); border: 1px solid var(--u-border-1);
    color: var(--u-text-2); margin-top: 2px;
    overflow: hidden;
  }
  &__avatar-img {
    width: 100%; height: 100%; object-fit: cover;
  }
  &--user &__avatar {
    background: var(--u-primary-light-9); color: var(--u-primary);
    border-color: var(--u-primary-light-7);
  }

  &__content { flex: 1; max-width: 80%; display: flex; flex-direction: column; gap: 0.6rem; }
  &__meta { display: flex; align-items: center; gap: 0.8rem; font-size: 1.2rem; color: var(--u-text-4); padding: 0 0.4rem; }
  &__name { font-weight: 600; color: var(--u-text-2); }
  &__bubble { padding: 1.2rem 1.6rem; font-size: var(--chat-font-size, 1.5rem); line-height: 1.6; word-break: break-word; &--loading { padding: 1.6rem 2rem; } }
  /* 用户纯文本需要 pre-wrap 保留换行；Markdown 用 normal 避免库内部空白节点被渲染 */
  &__text { white-space: pre-wrap; }
  &__text--md { white-space: normal; }
}

/* ===================== 输入区 ===================== */
.chat-input-container {
  width: 100%; margin: 0 auto;
  padding: 0 2rem 2rem; box-sizing: border-box;
  position: relative;
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
    box-sizing: border-box;
    line-height: 2.4rem;
    min-height: 3.6rem; /* 2.4rem line + 0.6rem*2 padding（border-box） */
    max-height: 13.2rem; /* 12rem content + 1.2rem padding */
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

  /** 模型调参按钮 */
  &__settings {
    width: 3.6rem; height: 3.6rem; border-radius: 50%;
    border: none; cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: transparent; color: var(--u-text-4);
    transition: all 0.2s ease;
    font-size: 1.3rem;

    &:hover { color: var(--u-text-2); background: var(--u-background-3); }
    &.is-active { color: var(--u-primary); background: var(--u-primary-light-9); }
  }

  /** RAG 开关按钮 */
  &__rag {
    width: 3.6rem; height: 3.6rem; border-radius: 50%;
    border: none; cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: transparent; color: var(--u-text-4);
    transition: all 0.2s ease;
    font-size: 1.3rem;

    &:hover { color: var(--u-text-2); background: var(--u-background-3); }
    &.is-active { color: var(--u-success, #52c41a); background: rgba(82, 196, 26, 0.1); }
  }

  /** 停止生成按钮 */
  &__stop {
    height: 3.6rem; border-radius: 1.8rem;
    border: 1px solid var(--u-danger, #ff4d4f); cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; gap: 0.4rem;
    background: transparent; color: var(--u-danger, #ff4d4f);
    padding: 0 1.4rem;
    transition: all 0.2s ease;
    font-size: 1.2rem; font-weight: 500;

    &:hover { background: rgba(255, 77, 79, 0.08); }
  }
}

.chat-input-hint {
  text-align: center; font-size: 1.1rem;
  color: var(--u-text-4); margin-top: 0.8rem;
}

/* ===================== 模型调参浮层 ===================== */
.model-popover {
  position: absolute;
  bottom: calc(100% + 0.8rem);
  right: 0;
  width: 320px;
  background: var(--u-background-1);
  border: 1px solid var(--u-border-1);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 100;
  overflow: hidden;

  &__header {
    display: flex; align-items: center; gap: 8px;
    padding: 14px 18px 10px;
    font-size: 1.3rem; font-weight: 700;
    color: var(--u-text-1);
    border-bottom: 1px solid var(--u-border-1);
    .u-icon { color: var(--u-primary); font-size: 1.2rem; }
  }

  &__body {
    padding: 16px 18px 12px;
    display: flex; flex-direction: column; gap: 16px;
  }

  &__field {
    display: flex; flex-direction: column; gap: 6px;
  }

  &__label {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 1.2rem; font-weight: 600;
    color: var(--u-text-2);
  }

  &__value {
    font-size: 1.15rem; font-weight: 500;
    color: var(--u-primary);
    background: rgba(var(--u-primary-rgb, 59,130,246), 0.1);
    padding: 1px 8px; border-radius: 6px;
    font-variant-numeric: tabular-nums;
  }

  &__footer {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 18px 14px;
    border-top: 1px solid var(--u-border-1);
  }

  &__link {
    display: flex; align-items: center; gap: 6px;
    background: none; border: none; cursor: pointer;
    font-size: 1.2rem; color: var(--u-text-3);
    transition: color 0.2s;
    &:hover { color: var(--u-primary); }
    .u-icon { font-size: 1.1rem; }
  }
}

/* 浮层过渡动画 */
.popover-fade-enter-active,
.popover-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.popover-fade-enter-from,
.popover-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
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

.chat-sidebar__header-actions {
  display: flex; gap: 0.4rem;
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
}

.chat-sidebar__empty {
  padding: 4rem 2rem; text-align: center;
  display: flex; flex-direction: column; align-items: center;
  gap: 1.2rem; color: var(--u-text-4);
}
.chat-sidebar__empty-icon { font-size: 3.2rem; opacity: 0.3; }

/* ===================== 文件夹 ===================== */
.folder-group {
  margin-bottom: 0.4rem;
}

.folder-header {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.8rem 1rem; border-radius: 10px;
  cursor: pointer; user-select: none;
  transition: background 0.2s ease;

  &:hover {
    background: var(--u-background-3);
    .folder-header__actions { opacity: 1; }
  }
}

.folder-header__icon {
  font-size: 1.4rem; color: var(--u-text-3);
  flex-shrink: 0; transition: color 0.2s;
  .folder-header:hover & { color: var(--u-primary); }
}

.folder-header__name {
  flex: 1; min-width: 0; font-size: 1.3rem; font-weight: 500;
  color: var(--u-text-2);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.folder-header__edit-input {
  width: 100%; border: none; background: var(--u-background-3);
  padding: 2px 6px; border-radius: 4px; font-size: 1.3rem;
  color: var(--u-text-1); outline: 2px solid var(--u-primary);
}

.folder-header__count {
  font-size: 1.1rem; color: var(--u-text-4);
  background: var(--u-background-3); padding: 0 0.5rem;
  border-radius: 8px; line-height: 1.8; flex-shrink: 0;
}

.folder-header__actions {
  display: flex; gap: 0.2rem; opacity: 0;
  transition: opacity 0.2s;

  button {
    width: 24px; height: 24px; border: none; border-radius: 6px;
    background: transparent; color: var(--u-text-3);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem; transition: all 0.15s;

    &:hover { background: var(--u-background-1); color: var(--u-primary); }
    &:last-child:hover { color: var(--u-danger); }
  }
}

.folder-sessions {
  padding-left: 1.2rem;
  .session-item { margin-bottom: 0.2rem; }
}

/* ===================== 侧栏分隔线 ===================== */
.sidebar-divider {
  display: flex; align-items: center; gap: 0.8rem;
  padding: 0.8rem 1rem; color: var(--u-text-4); font-size: 1.2rem;

  &::before, &::after {
    content: ''; flex: 1; height: 1px;
    background: var(--u-border-1);
  }
}

/* ===================== 移动到文件夹下拉 ===================== */
.session-move-dropdown {
  position: relative;
}

.session-move-dropdown__menu {
  position: absolute; right: 0; top: 100%; z-index: 20;
  min-width: 140px; padding: 0.4rem;
  background: var(--u-background-1); border: 1px solid var(--u-border-1);
  border-radius: 10px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  animation: slideDown 0.15s ease;
}

.session-move-dropdown__item {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.6rem 0.8rem; border-radius: 6px;
  cursor: pointer; font-size: 1.2rem; color: var(--u-text-2);
  transition: background 0.15s;
  white-space: nowrap;

  &:hover { background: var(--u-background-3); color: var(--u-primary); }

  .u-icon { font-size: 1.2rem; color: var(--u-text-3); }
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

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

/* 流式输出光标：闪烁竖线 */
.chat-message__cursor {
  display: inline-block;
  width: 2px;
  height: 1.1em;
  margin-left: 1px;
  vertical-align: text-bottom;
  background: var(--u-primary-0, #007bff);
  animation: blink-cursor 0.6s steps(2) infinite;
}
@keyframes blink-cursor {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ===================== 响应式 ===================== */
@media (max-width: 768px) {
  .chat-sidebar, .sidebar-toggle { display: none; }
  .chat-messages-list { padding: 0 1.6rem; }
  .chat-input-container { padding: 0 1.6rem 1.6rem; }
  .chat-empty__suggestions { grid-template-columns: 1fr; }
}
</style>
