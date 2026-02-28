<template>
  <div class="xiaohui-view">
    <!-- 左侧主区：消息列表 + 输入区 -->
    <div class="xiaohui-main">
      <!-- 消息列表区 -->
      <div ref="messageListRef" class="xiaohui-messages">
        <!-- 空状态 -->
        <template v-if="!currentMessages.length">
          <div class="xiaohui-empty">
            <div class="xiaohui-empty__logo">
              <div class="xiaohui-empty__icon-wrap">
                <span class="xiaohui-empty__avatar">惠</span>
              </div>
              <div class="xiaohui-empty__glow"></div>
            </div>
            <h2 class="xiaohui-empty__title">{{ t('xiaohui.title') }}</h2>
            <p class="xiaohui-empty__desc">{{ t('xiaohui.emptyDesc') }}</p>
            <!-- 快捷提示词 -->
            <div class="xiaohui-empty__suggestions">
              <div
                v-for="(s, idx) in suggestions"
                :key="idx"
                class="xiaohui-empty__suggestion"
                @click="handleSuggestionClick(s.text)"
              >
                <div class="xiaohui-empty__suggestion-icon-wrap">
                  <u-icon :icon="s.icon" class="xiaohui-empty__suggestion-icon" />
                </div>
                <span class="xiaohui-empty__suggestion-text">{{ s.text }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- 消息列表 -->
        <TransitionGroup v-else name="message" tag="div" class="xiaohui-messages-list">
          <div
            v-for="msg in currentMessages"
            :key="msg.id"
            :class="['xiaohui-msg', `xiaohui-msg--${msg.role}`]"
          >
            <!-- 头像 -->
            <div class="xiaohui-msg__avatar">
              <template v-if="msg.role === 'user'">
                <img
                  v-if="userStore.user?.avatar"
                  :src="userStore.user.avatar"
                  alt="avatar"
                  class="xiaohui-msg__avatar-img"
                />
                <img
                  v-else
                  :src="guestAvatarUrl"
                  alt="guest-avatar"
                  class="xiaohui-msg__avatar-img"
                />
              </template>
              <span v-else class="xiaohui-msg__bot-avatar">惠</span>
            </div>
            <!-- 内容 -->
            <div class="xiaohui-msg__content">
              <div class="xiaohui-msg__meta">
                <span class="xiaohui-msg__name">
                  {{ msg.role === 'user' ? displayName : t('xiaohui.name') }}
                </span>
                <span class="xiaohui-msg__time">{{ formatTime(msg.timestamp) }}</span>
              </div>
              <div class="xiaohui-msg__bubble">
                <div v-if="msg.role === 'user'" class="xiaohui-msg__text">{{ msg.content }}</div>
                <div v-else class="xiaohui-msg__text xiaohui-msg__text--md">
                  <MarkdownPreview
                    :content="normalizeStreamingMarkdown(msg.content, streaming && isLastAssistant(msg))"
                    :code-foldable="false"
                  />
                  <span v-if="streaming && isLastAssistant(msg)" class="xiaohui-msg__cursor" />
                </div>
              </div>
            </div>
          </div>
          <!-- 加载指示器 -->
          <div v-if="loading && !streaming" key="loading" class="xiaohui-msg xiaohui-msg--assistant">
            <div class="xiaohui-msg__avatar">
              <span class="xiaohui-msg__bot-avatar">惠</span>
            </div>
            <div class="xiaohui-msg__content">
              <div class="xiaohui-msg__meta">
                <span class="xiaohui-msg__name">{{ t('xiaohui.name') }}</span>
              </div>
              <div class="xiaohui-msg__bubble xiaohui-msg__bubble--loading">
                <div class="typing-indicator"><span></span><span></span><span></span></div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- 输入区 -->
      <div class="xiaohui-input-container">
        <div class="xiaohui-input-bar">
          <textarea
            ref="inputRef"
            v-model="inputText"
            class="xiaohui-input-bar__textarea"
            :placeholder="t('xiaohui.placeholder')"
            :disabled="loading"
            rows="1"
            @keydown="handleInputKeydown"
            @input="autoResizeTextarea"
          ></textarea>
          <!-- 发送 / 停止 -->
          <button
            v-if="loading"
            class="xiaohui-input-bar__stop"
            @click="handleStop"
            :title="t('xiaohui.stop')"
          >
            <u-icon icon="fa-solid fa-stop" />
          </button>
          <button
            v-else
            class="xiaohui-input-bar__send"
            :class="{ 'is-active': inputText.trim() }"
            :disabled="!inputText.trim()"
            @click="handleSend"
          >
            <u-icon icon="fa-solid fa-arrow-up" />
          </button>
        </div>
        <div class="xiaohui-input-hint">{{ t('xiaohui.hint') }}</div>
      </div>
    </div>

    <!-- 侧栏折叠按钮 -->
    <button
      class="sidebar-toggle"
      @click="toggleSidebar"
      :title="sidebarVisible ? t('xiaohui.collapseSidebar') : t('xiaohui.expandSidebar')"
    >
      <u-icon :icon="sidebarVisible ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left'" />
    </button>

    <!-- 右侧：历史会话侧栏 -->
    <aside class="xiaohui-sidebar" :class="{ 'xiaohui-sidebar--collapsed': !sidebarVisible }">
      <div class="xiaohui-sidebar__header">
        <div class="xiaohui-sidebar__title-area">
          <u-icon icon="fa-solid fa-history" />
          <span>{{ t('xiaohui.history') }}</span>
        </div>
        <div class="xiaohui-sidebar__header-actions">
          <button class="xiaohui-new-btn" @click="handleCreateFolder" :title="t('xiaohui.newFolder')">
            <u-icon icon="fa-solid fa-folder-plus" />
          </button>
          <button class="xiaohui-new-btn" @click="handleNewSession" :title="t('xiaohui.newChat')">
            <u-icon icon="fa-solid fa-plus" />
          </button>
        </div>
      </div>

      <div class="xiaohui-sidebar__content">
        <!-- 空状态 -->
        <template v-if="sessions.length === 0 && sortedFolders.length === 0">
          <div class="xiaohui-sidebar__empty">
            <u-icon icon="fa-solid fa-comments" class="xiaohui-sidebar__empty-icon" />
            <span>{{ t('xiaohui.noHistory') }}</span>
          </div>
        </template>
        <template v-else>
          <!-- 文件夹分组 -->
          <div
            v-for="folder in sortedFolders"
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
              <span class="folder-header__count">{{ getSessionsByFolder(folder.id).length }}</span>
              <div class="folder-header__actions" @click.stop>
                <button class="session-action-btn" :title="t('xiaohui.newChat')" @click="handleNewSessionInFolder(folder.id)">
                  <u-icon icon="fa-solid fa-plus" />
                </button>
                <button class="session-action-btn session-action-btn--danger" :title="t('xiaohui.deleteFolder')" @click="handleDeleteFolder(folder.id)">
                  <u-icon icon="fa-solid fa-trash" />
                </button>
              </div>
            </div>
            <div v-show="isFolderOpen(folder.id)" class="folder-sessions">
              <div
                v-for="session in getSessionsByFolder(folder.id)"
                :key="session.id"
                :class="['session-item', { 'session-item--active': session.id === currentSessionId }]"
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
                  <span class="session-item__time">{{ formatRelativeTime(session.updatedAt) }}</span>
                </div>
                <div class="session-item__foot">
                  <span class="session-item__preview">{{ getLastMessage(session) || t('xiaohui.newSession') }}</span>
                  <div class="session-item__actions" @click.stop>
                    <!-- 移到其他文件夹下拉 -->
                    <div v-if="sortedFolders.length > 1" class="session-move-dropdown">
                      <button class="session-action-btn" :title="t('xiaohui.moveToFolder')" @click.stop="toggleMoveMenu(session.id)">
                        <u-icon icon="fa-solid fa-file-arrow-down" />
                      </button>
                      <div v-if="moveMenuSessionId === session.id" class="session-move-dropdown__menu" @click.stop>
                        <button
                          v-for="f in sortedFolders.filter(f => f.id !== folder.id)"
                          :key="f.id"
                          class="session-move-dropdown__item"
                          @click="handleMoveToFolder(session.id, f.id)"
                        >
                          <u-icon icon="fa-solid fa-folder" />
                          {{ f.name }}
                        </button>
                      </div>
                    </div>
                    <button class="session-action-btn" :title="t('xiaohui.removeFromFolder')" @click="handleRemoveFromFolder(session.id)">
                      <u-icon icon="fa-solid fa-arrow-right-from-bracket" />
                    </button>
                    <button class="session-action-btn session-action-btn--danger" :title="t('xiaohui.deleteSession')" @click="requestDelete(session.id)">
                      <u-icon icon="fa-solid fa-trash" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 分隔线（仅当有文件夹且有未分类会话时显示） -->
          <div v-if="sortedFolders.length > 0 && uncategorizedSessions.length > 0" class="sidebar-divider">
            <span>{{ t('xiaohui.uncategorized') }}</span>
          </div>

          <!-- 未分类会话 -->
          <div class="session-list">
            <div
              v-for="session in uncategorizedSessions"
              :key="session.id"
              :class="['session-item', { 'session-item--active': session.id === currentSessionId }]"
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
                <span class="session-item__time">{{ formatRelativeTime(session.updatedAt) }}</span>
              </div>
              <div class="session-item__foot">
                <span class="session-item__preview">{{ getLastMessage(session) || t('xiaohui.newSession') }}</span>
                <div class="session-item__actions" @click.stop>
                  <!-- 移到文件夹下拉 -->
                  <div v-if="sortedFolders.length > 0" class="session-move-dropdown">
                    <button class="session-action-btn" :title="t('xiaohui.moveToFolder')" @click.stop="toggleMoveMenu(session.id)">
                      <u-icon icon="fa-solid fa-file-arrow-down" />
                    </button>
                    <div v-if="moveMenuSessionId === session.id" class="session-move-dropdown__menu" @click.stop>
                      <button
                        v-for="folder in sortedFolders"
                        :key="folder.id"
                        class="session-move-dropdown__item"
                        @click="handleMoveToFolder(session.id, folder.id)"
                      >
                        <u-icon icon="fa-solid fa-folder" />
                        {{ folder.name }}
                      </button>
                    </div>
                  </div>
                  <button class="session-action-btn" :title="t('xiaohui.rename')" @click="startEditing(session)">
                    <u-icon icon="fa-solid fa-pen" />
                  </button>
                  <button class="session-action-btn session-action-btn--danger" :title="t('xiaohui.deleteSession')" @click="requestDelete(session.id)">
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
      :title="t('xiaohui.deleteSession')"
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
          <h3>{{ t('xiaohui.confirmDelete') }}</h3>
          <p>{{ t('xiaohui.deleteWarning') }}</p>
        </div>
      </div>
    </u-dialog>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { UMessageFn, getRandomAvatarUrl } from '@u-blog/ui'
import { sendXiaohuiStream, type XiaohuiMessage } from '@/api/xiaohui'
import { useUserStore } from '@/stores/model/user'
import { useAppStore } from '@/stores/app'
import { STORAGE_KEYS } from '@/constants/storage'
import MarkdownPreview from '@/components/MarkdownPreview.vue'
import { normalizeStreamingMarkdown } from '@/utils/markdownStreaming'

defineOptions({ name: 'XiaohuiView' })

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

/* ===================== 类型定义 ===================== */

/** 本地消息 */
interface LocalMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

/** 会话 */
interface XiaohuiSession {
  id: string
  title: string
  messages: LocalMessage[]
  createdAt: number
  updatedAt: number
  /** 所属文件夹 id，undefined 表示未分类 */
  folderId?: string
}

/** 会话文件夹 */
interface XiaohuiFolder {
  id: string
  name: string
  createdAt: number
  order: number
}

/* ===================== 会话持久化 ===================== */

/** 从 localStorage 加载会话列表 */
function loadSessions(): XiaohuiSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.XIAOHUI_SESSIONS)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

/** 保存会话列表到 localStorage */
function saveSessions() {
  try {
    localStorage.setItem(STORAGE_KEYS.XIAOHUI_SESSIONS, JSON.stringify(sessions.value))
  } catch { /* ignore */ }
}

/** 加载当前会话 ID */
function loadCurrentSessionId(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.XIAOHUI_CURRENT_SESSION) || ''
  } catch { return '' }
}

/** 保存当前会话 ID */
function saveCurrentSessionId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.XIAOHUI_CURRENT_SESSION, id)
  } catch { /* ignore */ }
}

/* ===================== 文件夹持久化 ===================== */

/** 从 localStorage 加载文件夹列表 */
function loadFolders(): XiaohuiFolder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.XIAOHUI_FOLDERS)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

/** 保存文件夹列表到 localStorage */
function saveFolders() {
  try {
    localStorage.setItem(STORAGE_KEYS.XIAOHUI_FOLDERS, JSON.stringify(folders.value))
  } catch { /* ignore */ }
}

/** 加载文件夹展开状态 */
function loadFolderOpenState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.XIAOHUI_FOLDERS_OPEN)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

/** 保存文件夹展开状态 */
function saveFolderOpenState() {
  try {
    localStorage.setItem(STORAGE_KEYS.XIAOHUI_FOLDERS_OPEN, JSON.stringify(folderOpenMap.value))
  } catch { /* ignore */ }
}

/* ===================== 状态 ===================== */

const sessions = ref<XiaohuiSession[]>(loadSessions())
const currentSessionId = ref(loadCurrentSessionId())
const inputText = ref('')
const inputRef = ref<HTMLTextAreaElement | null>(null)
const messageListRef = ref<HTMLElement | null>(null)
const loading = ref(false)
const streaming = ref(false)
let abortController: AbortController | null = null

/* ===================== 文件夹状态 ===================== */
const folders = ref<XiaohuiFolder[]>(loadFolders())
const folderOpenMap = ref<Record<string, boolean>>(loadFolderOpenState())
const editingFolderId = ref<string | null>(null)
const editingFolderName = ref('')
const moveMenuSessionId = ref<string | null>(null)

/** 按 order 升序排列的文件夹 */
const sortedFolders = computed(() =>
  [...folders.value].sort((a, b) => a.order - b.order),
)

/** 获取某个文件夹下的会话（按更新时间倒序） */
function getSessionsByFolder(folderId: string): XiaohuiSession[] {
  return sessions.value
    .filter(s => s.folderId === folderId)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

/** 未分类会话（按更新时间倒序） */
const uncategorizedSessions = computed(() =>
  sessions.value
    .filter(s => !s.folderId)
    .sort((a, b) => b.updatedAt - a.updatedAt),
)

/* ===================== 侧栏 ===================== */
function loadSidebarVisible(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.XIAOHUI_SIDEBAR_VISIBLE)
    if (v === 'true' || v === 'false') return v === 'true'
  } catch { /* ignore */ }
  return true
}

const sidebarVisible = ref(loadSidebarVisible())

function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value
  try {
    localStorage.setItem(STORAGE_KEYS.XIAOHUI_SIDEBAR_VISIBLE, String(sidebarVisible.value))
  } catch { /* ignore */ }
}

/* ===================== 会话编辑 ===================== */
const editingSessionId = ref<string | null>(null)
const editingTitle = ref('')
const showDeleteDialog = ref(false)
const sessionToDelete = ref<string | null>(null)

/* ===================== 文件夹操作 ===================== */

function isFolderOpen(folderId: string): boolean {
  return folderOpenMap.value[folderId] !== false // 默认展开
}

function toggleFolder(folderId: string) {
  folderOpenMap.value[folderId] = !isFolderOpen(folderId)
  saveFolderOpenState()
}

/** 新建文件夹 */
function handleCreateFolder() {
  const name = t('xiaohui.newFolder')
  const maxOrder = folders.value.reduce((max, f) => Math.max(max, f.order), 0)
  const folder: XiaohuiFolder = {
    id: generateId(),
    name,
    createdAt: Date.now(),
    order: maxOrder + 1,
  }
  folders.value.push(folder)
  saveFolders()
  // 自动进入重命名状态
  editingFolderId.value = folder.id
  editingFolderName.value = name
  nextTick(() => {
    const input = document.querySelector('.folder-header__edit-input') as HTMLInputElement
    input?.focus()
    input?.select()
  })
}

/** 开始编辑文件夹名 */
function startFolderEditing(folder: XiaohuiFolder) {
  editingFolderId.value = folder.id
  editingFolderName.value = folder.name
  nextTick(() => {
    const input = document.querySelector('.folder-header__edit-input') as HTMLInputElement
    input?.focus()
    input?.select()
  })
}

/** 完成文件夹重命名 */
function finishFolderEditing() {
  if (editingFolderId.value && editingFolderName.value.trim()) {
    const folder = folders.value.find(f => f.id === editingFolderId.value)
    if (folder) {
      folder.name = editingFolderName.value.trim()
      saveFolders()
    }
  }
  editingFolderId.value = null
  editingFolderName.value = ''
}

function cancelFolderEditing() {
  editingFolderId.value = null
  editingFolderName.value = ''
}

/** 删除文件夹（内部会话移至未分类） */
function handleDeleteFolder(folderId: string) {
  const idx = folders.value.findIndex(f => f.id === folderId)
  if (idx === -1) return
  folders.value.splice(idx, 1)
  // 文件夹内会话移至未分类
  sessions.value.forEach(s => {
    if (s.folderId === folderId) s.folderId = undefined
  })
  saveFolders()
  saveSessions()
}

/** 切换移动菜单显隐 */
function toggleMoveMenu(sessionId: string) {
  moveMenuSessionId.value = moveMenuSessionId.value === sessionId ? null : sessionId
}

/** 移动会话到指定文件夹 */
function handleMoveToFolder(sessionId: string, folderId: string) {
  const session = sessions.value.find(s => s.id === sessionId)
  if (session) {
    session.folderId = folderId
    saveSessions()
  }
  moveMenuSessionId.value = null
}

/** 将会话移出文件夹（未分类） */
function handleRemoveFromFolder(sessionId: string) {
  const session = sessions.value.find(s => s.id === sessionId)
  if (session) {
    session.folderId = undefined
    saveSessions()
  }
}

/** 在指定文件夹中新建会话 */
function handleNewSessionInFolder(folderId: string) {
  const id = generateId()
  const session: XiaohuiSession = {
    id,
    title: t('xiaohui.newSession'),
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    folderId,
  }
  sessions.value.unshift(session)
  currentSessionId.value = id
  saveCurrentSessionId(id)
  saveSessions()
  inputText.value = ''
  loading.value = false
  streaming.value = false
}

/* ===================== 计算属性 ===================== */

/** 当前显示的用户名 */
const displayName = computed(() => {
  if (userStore.isLoggedIn) {
    return userStore.user?.namec || userStore.user?.username || t('xiaohui.guest')
  }
  return t('xiaohui.guest')
})

/** 游客随机头像（基于用户名或 "guest" 生成确定性头像） */
const guestAvatarUrl = computed(() => {
  const seed = displayName.value || 'guest'
  return getRandomAvatarUrl(seed)
})

/** 当前会话 */
const currentSession = computed(() => {
  return sessions.value.find(s => s.id === currentSessionId.value) || null
})

/** 当前会话的消息列表 */
const currentMessages = computed(() => {
  return currentSession.value?.messages || []
})

/** 按更新时间排序的会话列表（侧栏使用） */
// sessions 已经按 updatedAt 排序（每次更新时调整顺序）

/** 快捷提示词 */
const suggestions = computed(() => [
  { icon: 'fa-solid fa-fire', text: t('xiaohui.promptHotArticles') },
  { icon: 'fa-solid fa-clock', text: t('xiaohui.promptLatestArticles') },
  { icon: 'fa-solid fa-palette', text: t('xiaohui.promptToggleTheme') },
  { icon: 'fa-solid fa-lightbulb', text: t('xiaohui.promptRecommend') },
])

/* ===================== 生命周期 ===================== */

onMounted(() => {
  // 若无会话或当前会话已失效，创建新会话
  if (!currentSession.value) {
    if (sessions.value.length > 0) {
      // 切换到最近的会话
      currentSessionId.value = sessions.value[0].id
      saveCurrentSessionId(currentSessionId.value)
    } else {
      createSession()
    }
  }
})

/* ===================== 工具函数 ===================== */

function generateId(): string {
  return `xh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 相对时间格式化（侧栏） */
function formatRelativeTime(timestamp: number | undefined | null): string {
  const ts = timestamp != null ? Number(timestamp) : NaN
  if (!Number.isFinite(ts)) return ''
  const now = Date.now()
  const diff = now - ts
  const minute = 60_000
  const hour = 3_600_000
  const day = 86_400_000
  if (diff < minute) return t('common.justNow')
  if (diff < hour) return `${Math.floor(diff / minute)}m`
  if (diff < day) return `${Math.floor(diff / hour)}h`
  const date = new Date(ts)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function isLastAssistant(msg: LocalMessage): boolean {
  const assistantMsgs = currentMessages.value.filter(m => m.role === 'assistant')
  return assistantMsgs.length > 0 && assistantMsgs[assistantMsgs.length - 1].id === msg.id
}

function scrollToBottom() {
  nextTick(() => {
    const el = messageListRef.value
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  })
}

/** 获取会话最后一条消息预览 */
function getLastMessage(session: XiaohuiSession): string {
  if (!session.messages?.length) return ''
  const lastMsg = session.messages[session.messages.length - 1]
  if (!lastMsg) return ''
  const content = lastMsg.content.slice(0, 30)
  return `${content}${lastMsg.content.length > 30 ? '...' : ''}`
}

/* ===================== 会话管理 ===================== */

/** 创建新会话 */
function createSession(): string {
  const id = generateId()
  const session: XiaohuiSession = {
    id,
    title: t('xiaohui.newSession'),
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  sessions.value.unshift(session)
  currentSessionId.value = id
  saveCurrentSessionId(id)
  saveSessions()
  return id
}

/** 切换会话 */
function handleSessionClick(sessionId: string) {
  if (sessionId !== currentSessionId.value) {
    currentSessionId.value = sessionId
    saveCurrentSessionId(sessionId)
    nextTick(scrollToBottom)
  }
}

/** 新建会话 */
function handleNewSession() {
  createSession()
  inputText.value = ''
  loading.value = false
  streaming.value = false
}

/** 开始编辑会话标题 */
function startEditing(session: XiaohuiSession) {
  editingSessionId.value = session.id
  editingTitle.value = session.title
  nextTick(() => {
    const input = document.querySelector('.session-item__edit-input') as HTMLInputElement
    input?.focus()
    input?.select()
  })
}

/** 完成编辑 */
function finishEditing() {
  if (editingSessionId.value && editingTitle.value.trim()) {
    const session = sessions.value.find(s => s.id === editingSessionId.value)
    if (session) {
      session.title = editingTitle.value.trim()
      saveSessions()
    }
  }
  editingSessionId.value = null
  editingTitle.value = ''
}

/** 取消编辑 */
function cancelEditing() {
  editingSessionId.value = null
  editingTitle.value = ''
}

/** 请求删除（弹框确认） */
function requestDelete(sessionId: string) {
  sessionToDelete.value = sessionId
  showDeleteDialog.value = true
}

/** 确认删除 */
function confirmDelete() {
  if (sessionToDelete.value) {
    const idx = sessions.value.findIndex(s => s.id === sessionToDelete.value)
    if (idx !== -1) {
      sessions.value.splice(idx, 1)
    }
    // 若删除的是当前会话，切换到最近的或新建
    if (sessionToDelete.value === currentSessionId.value) {
      if (sessions.value.length > 0) {
        currentSessionId.value = sessions.value[0].id
        saveCurrentSessionId(currentSessionId.value)
      } else {
        createSession()
      }
    }
    saveSessions()
    sessionToDelete.value = null
  }
  showDeleteDialog.value = false
}

/* ===================== 输入交互 ===================== */

function handleInputKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
  nextTick(autoResizeTextarea)
}

const TEXTAREA_MIN_H = 36
const TEXTAREA_MAX_H = 132

function autoResizeTextarea() {
  const el = inputRef.value
  if (!el) return
  el.style.height = `${TEXTAREA_MIN_H}px`
  const sh = el.scrollHeight
  const next = Math.min(sh, TEXTAREA_MAX_H)
  el.style.height = `${next}px`
  el.style.overflowY = next >= TEXTAREA_MAX_H ? 'auto' : 'hidden'
}

/* ===================== XCMD 命令协议解析 ===================== */

/** XCMD 正则：匹配 <!--XCMD:ACTION:VALUE--> */
const XCMD_PATTERN = /<!--XCMD:(\w+):(.+?)-->/g

/**
 * 解析并执行 AI 回复中的 XCMD 命令
 * 命令格式：<!--XCMD:ACTION:VALUE-->（HTML注释，Markdown 渲染时不可见）
 * @param content AI 回复全文
 * @returns 去除 XCMD 命令后的纯内容
 */
function parseAndExecuteCommands(content: string): string {
  const commands: Array<{ action: string; value: string }> = []
  let match: RegExpExecArray | null
  const regex = new RegExp(XCMD_PATTERN.source, 'g')

  // 收集所有命令
  while ((match = regex.exec(content)) !== null) {
    commands.push({ action: match[1], value: match[2] })
  }

  // 执行命令
  for (const cmd of commands) {
    try {
      switch (cmd.action) {
        case 'SET_THEME': {
          if (cmd.value === 'toggle') {
            // 深浅互换
            appStore.toggleTheme()
          } else {
            appStore.setTheme(cmd.value as any)
          }
          break
        }
        case 'SET_LANG': {
          appStore.setLanguage(cmd.value as any)
          break
        }
        case 'SET_LIST_STYLE': {
          appStore.setArticleListType(cmd.value as any)
          break
        }
        case 'SET_VISUAL_STYLE': {
          appStore.setVisualStyle(cmd.value as any)
          break
        }
        case 'NAVIGATE': {
          // 延迟导航，等消息渲染完成
          const path = cmd.value
          setTimeout(() => {
            router.push(path).catch(() => {})
          }, 500)
          break
        }
        default:
          console.warn('[XCMD] 未知命令:', cmd.action)
      }
    } catch (err) {
      console.error('[XCMD] 执行失败:', cmd, err)
    }
  }

  // 从内容中移除 XCMD 命令（包括前后空行），保持干净的显示
  return content.replace(/\n*<!--XCMD:\w+:.+?-->\n*/g, '').trim()
}

/* ===================== 发送消息 ===================== */

async function handleSend() {
  const text = inputText.value?.trim()
  if (!text || loading.value) return

  // 确保有当前会话
  if (!currentSession.value) {
    createSession()
  }

  const session = currentSession.value!

  // 添加用户消息
  const userMsg: LocalMessage = {
    id: generateId(),
    role: 'user',
    content: text,
    timestamp: Date.now(),
  }
  session.messages.push(userMsg)
  session.updatedAt = Date.now()

  // 自动设置标题（首条消息截取前20字符）
  if (session.messages.filter(m => m.role === 'user').length === 1) {
    session.title = text.length > 20 ? text.slice(0, 20) + '...' : text
  }

  // 将当前会话置顶
  const idx = sessions.value.findIndex(s => s.id === session.id)
  if (idx > 0) {
    sessions.value.splice(idx, 1)
    sessions.value.unshift(session)
  }

  inputText.value = ''
  loading.value = true
  saveSessions()

  nextTick(() => {
    scrollToBottom()
    if (inputRef.value) {
      inputRef.value.style.height = ''
      inputRef.value.style.overflowY = 'hidden'
    }
  })

  // 构建完整的消息上下文
  const payloadMessages: XiaohuiMessage[] = session.messages.map(m => ({
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
  }))

  // 创建 AI 占位消息
  const assistantMsg: LocalMessage = {
    id: generateId(),
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
  }
  session.messages.push(assistantMsg)
  streaming.value = true

  abortController = new AbortController()

  try {
    await sendXiaohuiStream(
      payloadMessages,
      session.id,
      (token) => {
        // 追加 token 到最后一条 assistant 消息
        const last = session.messages[session.messages.length - 1]
        if (last && last.role === 'assistant') {
          last.content += token
        }
        nextTick(scrollToBottom)
      },
      abortController.signal,
    )
  } catch (e) {
    if ((e as Error).name === 'AbortError') {
      // 用户手动取消
    } else {
      const errMsg = (e as Error).message || t('xiaohui.error')
      UMessageFn({ message: errMsg, type: 'error' })
      // 移除空的 AI 消息
      const last = session.messages[session.messages.length - 1]
      if (last && last.role === 'assistant' && !last.content) {
        session.messages.pop()
      }
    }
  } finally {
    loading.value = false
    streaming.value = false
    abortController = null

    // 解析并执行 AI 回复中的 XCMD 命令
    const lastMsg = session.messages[session.messages.length - 1]
    if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content) {
      lastMsg.content = parseAndExecuteCommands(lastMsg.content)
    }

    session.updatedAt = Date.now()
    saveSessions()
  }
}

function handleStop() {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
  loading.value = false
  streaming.value = false
}

function handleSuggestionClick(text: string) {
  inputText.value = text
  nextTick(() => handleSend())
}
</script>

<style lang="scss" scoped>
/* ===================== 布局（与助手页保持一致的三栏结构） ===================== */
.xiaohui-view {
  height: 100%;
  display: flex;
  background: var(--u-background-1);
  color: var(--u-text-1);
  overflow: hidden;
  position: relative;
}

.xiaohui-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* ===================== 消息列表 ===================== */
.xiaohui-messages {
  flex: 1;
  overflow-y: auto;
  padding: 2rem 0;
}

.xiaohui-messages-list {
  width: 100%;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* ===================== 空状态 ===================== */
.xiaohui-empty {
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
    background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%);
    display: flex; align-items: center; justify-content: center;
    position: relative; z-index: 2;
    box-shadow: 0 12px 32px -8px rgba(124, 58, 237, 0.4);
  }

  &__icon-wrap .xiaohui-empty__avatar {
    font-size: 36px;
    font-weight: 700;
    color: #fff;
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  }

  &__glow {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 120px; height: 120px; background: #7c3aed;
    opacity: 0.15; filter: blur(40px); border-radius: 50%; z-index: 1;
  }

  &__title {
    font-size: 2.4rem; font-weight: 700; margin: 0 0 0.8rem;
    background: linear-gradient(to right, var(--u-text-1), var(--u-text-3));
    background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }

  &__desc {
    font-size: 1.6rem; color: var(--u-text-3); margin: 0 0 4rem; max-width: 400px;
    text-align: center;
  }

  &__suggestions {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 1.2rem; width: 100%; max-width: 600px;
  }

  &__suggestion {
    padding: 1.6rem; background: var(--u-background-2);
    border: 1px solid var(--u-border-1); border-radius: 1.6rem;
    cursor: pointer; display: flex; align-items: center; gap: 1.2rem;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

    &:hover {
      border-color: rgba(124, 58, 237, 0.3); background: var(--u-background-1);
      transform: translateY(-2px); box-shadow: 0 8px 24px -12px rgba(0, 0, 0, 0.1);
    }
  }

  &__suggestion-icon-wrap {
    width: 36px; height: 36px; border-radius: 10px;
    background: var(--u-background-3); display: flex;
    align-items: center; justify-content: center;
    color: var(--u-text-2); transition: all 0.3s ease;
  }
  &__suggestion:hover &__suggestion-icon-wrap {
    background: rgba(124, 58, 237, 0.1); color: #a78bfa;
  }

  &__suggestion-icon { font-size: 1.4rem; }
  &__suggestion-text { font-size: 1.4rem; color: var(--u-text-2); font-weight: 500; }
}

/* ===================== 消息气泡 ===================== */
.xiaohui-msg {
  display: flex; gap: 1.6rem;

  &--user {
    flex-direction: row-reverse;
    .xiaohui-msg__content { align-items: flex-end; }
    .xiaohui-msg__bubble {
      background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
      color: #fff; border-radius: 1.6rem 0.4rem 1.6rem 1.6rem;
      box-shadow: 0 4px 12px -4px rgba(124, 58, 237, 0.3);
    }
    .xiaohui-msg__meta { flex-direction: row-reverse; }
  }

  &--assistant .xiaohui-msg__bubble {
    background: transparent; border: none;
    color: var(--u-text-1); border-radius: 0;
    padding: 0;
  }

  /* 助手 Markdown 内容区 */
  &--assistant .xiaohui-msg__text--md {
    font-size: 1.5rem;
    line-height: 1.6;

    :deep(.markdown-preview) { font-size: inherit; }

    :deep(.md-editor-preview) {
      font-size: inherit;
      line-height: 1.6;

      h1, h2, h3, h4, h5, h6 { margin: 1em 0 0.4em; line-height: 1.35; font-weight: 600; }
      h1 { font-size: 1.4em; }
      h2 { font-size: 1.25em; }
      h3 { font-size: 1.15em; }
      h4 { font-size: 1.05em; }

      p { margin: 0.6em 0; font-size: inherit; line-height: 1.6; }

      ul, ol { margin: 0.6em 0; padding-left: 1.5em; line-height: 1.6; }
      li { margin: 0.2em 0; line-height: 1.6; }
      li > p { margin: 0.15em 0; }

      blockquote { margin: 0.6em 0; line-height: 1.6; p { margin: 0.2em 0; } }
      hr { margin: 0.8em 0; }

      table {
        margin: 0.6em 0; width: 100%; border-collapse: collapse;
        border-radius: 8px; overflow: hidden;
        border: 1px solid var(--u-border-1); font-size: 0.92em;
        display: block; overflow-x: auto;
      }
      th, td { border-color: var(--u-border-1); padding: 8px 12px; }
      th { background: var(--u-background-3) !important; color: var(--u-text-1); font-weight: 600; }
      td { color: var(--u-text-2); }
      tr { background-color: transparent !important; }
      tr:nth-child(2n) { background-color: var(--u-background-2) !important; }
      tbody tr:hover { background-color: var(--u-background-3) !important; }

      .md-editor-code { margin: 0.75em 0; }
      .md-editor-code .md-editor-code-head { position: relative; top: auto; z-index: auto; }

      & > :first-child { margin-top: 0; }
      & > :last-child { margin-bottom: 0; }
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
  &__avatar-img { width: 100%; height: 100%; object-fit: cover; }
  &--user &__avatar {
    background: rgba(124, 58, 237, 0.08); color: #7c3aed;
    border-color: rgba(124, 58, 237, 0.2);
  }

  &__bot-avatar {
    font-size: 16px; font-weight: 700; color: #a78bfa;
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  }

  &__content { flex: 1; max-width: 80%; display: flex; flex-direction: column; gap: 0.6rem; min-width: 0; overflow: hidden; }
  &__meta { display: flex; align-items: center; gap: 0.8rem; font-size: 1.2rem; color: var(--u-text-4); padding: 0 0.4rem; }
  &__name { font-weight: 600; color: var(--u-text-2); }
  &__time { font-size: 1.1rem; }
  &__bubble { padding: 1.2rem 1.6rem; font-size: 1.5rem; line-height: 1.6; word-break: break-word; overflow-x: auto; &--loading { padding: 1.6rem 2rem; } }
  &__text { white-space: pre-wrap; }
  &__text--md { white-space: normal; }

  &__cursor {
    display: inline-block; width: 2px; height: 1.1em;
    margin-left: 1px; vertical-align: text-bottom;
    background: #7c3aed; animation: blink-cursor 0.6s steps(2) infinite;
  }
}

/* ===================== 输入区 ===================== */
.xiaohui-input-container {
  width: 100%; margin: 0 auto;
  padding: 0 2rem 2rem; box-sizing: border-box;
  position: relative;
}

.xiaohui-input-bar {
  display: flex; align-items: flex-end;
  background: var(--u-background-2);
  border: 1px solid var(--u-border-1);
  border-radius: 2.4rem;
  padding: 0.6rem 0.6rem 0.6rem 1.8rem;
  gap: 0.8rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus-within {
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
  }

  &__textarea {
    flex: 1; min-width: 0;
    background: transparent; border: none; outline: none;
    font-size: 1.4rem; color: var(--u-text-1);
    font-family: inherit;
    resize: none; overflow-y: hidden; box-sizing: border-box;
    line-height: 2.4rem;
    min-height: 3.6rem; max-height: 13.2rem;
    padding: 0.6rem 0;
    &::placeholder { color: var(--u-text-4); }
    &:disabled { cursor: not-allowed; opacity: 0.5; }
  }

  &__send {
    width: 3.6rem; height: 3.6rem; border-radius: 50%;
    border: none; cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: var(--u-background-3); color: var(--u-text-4);
    transition: all 0.2s ease; font-size: 1.4rem;

    &.is-active {
      background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
      color: #fff;
      &:hover { filter: brightness(1.1); transform: scale(1.05); }
      &:active { transform: scale(0.95); }
    }
    &:disabled { cursor: not-allowed; }
  }

  &__stop {
    height: 3.6rem; border-radius: 1.8rem;
    border: 1px solid var(--u-danger, #ff4d4f); cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; gap: 0.4rem;
    background: transparent; color: var(--u-danger, #ff4d4f);
    padding: 0 1.4rem; transition: all 0.2s ease;
    font-size: 1.2rem; font-weight: 500;
    &:hover { background: rgba(255, 77, 79, 0.08); }
  }
}

.xiaohui-input-hint {
  text-align: center; font-size: 1.1rem;
  color: var(--u-text-4); margin-top: 0.8rem;
}

/* ===================== 侧栏 ===================== */
.xiaohui-sidebar {
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
  font-size: 1rem; padding: 0;
  transition: color 0.2s, background 0.2s;
  &:hover { color: #7c3aed; background: var(--u-background-3); }
}

.xiaohui-sidebar__header {
  padding: 2rem; display: flex; align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--u-border-1);
}

.xiaohui-sidebar__header-actions {
  display: flex; gap: 0.4rem;
}

.xiaohui-sidebar__title-area {
  display: flex; align-items: center; gap: 0.8rem;
  font-weight: 600; font-size: 1.6rem;
}

.xiaohui-new-btn {
  width: 32px; height: 32px; border-radius: 8px;
  border: 1px solid var(--u-border-1);
  background: var(--u-background-1); color: var(--u-text-2);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s ease;
  &:hover { border-color: #7c3aed; color: #7c3aed; background: rgba(124, 58, 237, 0.06); }
}

.xiaohui-sidebar__content {
  flex: 1; overflow-y: auto; padding: 0.8rem;
}

.xiaohui-sidebar__empty {
  padding: 4rem 2rem; text-align: center;
  display: flex; flex-direction: column; align-items: center;
  gap: 1.2rem; color: var(--u-text-4);
}
.xiaohui-sidebar__empty-icon { font-size: 3.2rem; opacity: 0.3; }

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
  .folder-header:hover & { color: #a78bfa; }
}

.folder-header__name {
  flex: 1; min-width: 0; font-size: 1.3rem; font-weight: 500;
  color: var(--u-text-2);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.folder-header__edit-input {
  width: 100%; border: none; background: var(--u-background-3);
  padding: 2px 6px; border-radius: 4px; font-size: 1.3rem;
  color: var(--u-text-1); outline: 2px solid #7c3aed;
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

    &:hover { background: var(--u-background-1); color: #7c3aed; }
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
  border: none; background: transparent; width: 100%;

  &:hover { background: var(--u-background-3); color: #7c3aed; }

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
      width: 3px; background: #7c3aed; border-radius: 0 3px 3px 0;
    }
    .session-item__title { color: #7c3aed; font-weight: 600; }
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
  color: var(--u-text-1); outline: 2px solid #7c3aed;
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
  &:hover { color: #7c3aed; background: rgba(124, 58, 237, 0.08); }
  &--danger:hover { color: var(--u-danger); background: var(--u-danger-light-9, rgba(255, 77, 79, 0.08)); }
}

/* ===================== 删除弹窗 ===================== */
.delete-confirm {
  display: flex; gap: 2rem; padding: 1rem 0;
  &__icon {
    width: 48px; height: 48px; border-radius: 50%;
    background: var(--u-danger-light-9, rgba(255, 77, 79, 0.1)); color: var(--u-danger, #ff4d4f);
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

@keyframes blink-cursor {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
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

/* 消息过渡 */
.message-enter-active { transition: all 0.3s ease-out; }
.message-enter-from { opacity: 0; transform: translateY(16px); }

/* ===================== 响应式 ===================== */
@media (max-width: 768px) {
  /* 侧栏隐藏 */
  .xiaohui-sidebar, .sidebar-toggle { display: none; }

  /* 消息列表 */
  .xiaohui-messages { padding: 0.8rem 0; }
  .xiaohui-messages-list { padding: 0 1.2rem; gap: 1.6rem; }

  /* 空状态整体收紧 */
  .xiaohui-empty {
    padding: 1.2rem 1.6rem;
    justify-content: center;

    /* Logo 缩小 */
    &__logo { margin-bottom: 1.2rem; }
    &__icon-wrap { width: 52px; height: 52px; border-radius: 14px; }
    &__icon-wrap .xiaohui-empty__avatar { font-size: 24px; }
    &__glow { width: 72px; height: 72px; }

    /* 标题 & 描述 */
    &__title { font-size: 1.8rem; margin-bottom: 0.3rem; }
    &__desc { font-size: 1.3rem; margin: 0 0 1.6rem; max-width: 90%; }

    /* 建议卡片 - 单列布局 */
    &__suggestions {
      grid-template-columns: 1fr;
      gap: 0.6rem;
      max-width: 100%;
    }

    &__suggestion {
      padding: 0.9rem 1.2rem;
      gap: 1rem;
      border-radius: 1.2rem;
    }
    &__suggestion-icon-wrap { width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0; }
    &__suggestion-icon { font-size: 1.2rem; }
    &__suggestion-text { font-size: 1.3rem; }
  }

  /* 输入区 */
  .xiaohui-input-container { padding: 0 1.2rem 1rem; }
  .xiaohui-input-bar {
    border-radius: 2rem;
    padding: 0.4rem 0.4rem 0.4rem 1.4rem;
    &__textarea { font-size: 1.3rem; min-height: 3.2rem; line-height: 2.2rem; }
    &__send { width: 3.2rem; height: 3.2rem; font-size: 1.2rem; }
    &__stop { height: 3.2rem; font-size: 1.1rem; padding: 0 1rem; }
  }
  .xiaohui-input-hint { font-size: 1rem; margin-top: 0.4rem; }

  /* 消息气泡 */
  .xiaohui-msg {
    gap: 0.8rem;
    &__avatar { width: 32px; height: 32px; border-radius: 10px; font-size: 1.3rem; }
    &__bot-avatar { font-size: 14px; }
    &__content { max-width: 85%; }
    &__meta { font-size: 1.1rem; gap: 0.4rem; }
    &__name { font-size: 1.1rem; }
    &__time { font-size: 1rem; }
    &__bubble { padding: 1rem 1.2rem; font-size: 1.35rem; }
  }
}
</style>
