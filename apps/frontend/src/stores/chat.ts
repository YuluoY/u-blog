import { STORAGE_KEYS } from '@/constants/storage'
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import * as chatDB from '@/utils/chatDB'
import { useUserStore } from '@/stores/model/user'

/* ========== 类型定义 ========== */

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
  /** 所属文件夹 id，undefined 表示未分类 */
  folderId?: string
}

/** 会话文件夹（用于分类管理历史会话） */
export interface ChatFolder {
  id: string
  name: string
  createdAt: number
  /** 排序序号，越小越靠前 */
  order: number
}

const MAX_SESSIONS = 100

function generateId(): string
{
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function generateTitle(firstMessage: string): string
{
  const title = firstMessage.trim().slice(0, 30)
  return title.length < firstMessage.trim().length ? `${title}...` : title
}

function loadFromStorage(): ChatSession[]
{
  // 仅用于首次迁移，正常启动走 initFromDB
  try
  {
    const data = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS)
    const sessions = data ? JSON.parse(data) : []
    const now = Date.now()
    return sessions.map((session: any) =>
    {
      const ts = typeof session.updatedAt === 'number' && !Number.isNaN(session.updatedAt)
        ? session.updatedAt
        : (typeof session.createdAt === 'number' && !Number.isNaN(session.createdAt) ? session.createdAt : now)
      return {
        ...session,
        messages: session.messages || [],
        createdAt: typeof session.createdAt === 'number' && !Number.isNaN(session.createdAt) ? session.createdAt : now,
        updatedAt: ts,
      }
    })
  }
  catch
  {
    return []
  }
}

function loadFoldersFromStorage(): ChatFolder[]
{
  // 仅用于首次迁移
  try
  {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT_FOLDERS)
    return raw ? JSON.parse(raw) : []
  }
  catch
  {
    return []
  }
}

/* ========== IndexedDB 写入包装（fire-and-forget） ========== */

function persistSession(session: ChatSession): void
{
  chatDB.putSession(session).catch(e =>
    console.warn('[ChatStore] putSession failed:', e),
  )
}

function persistFolder(folder: ChatFolder): void
{
  chatDB.putFolder(folder).catch(e =>
    console.warn('[ChatStore] putFolder failed:', e),
  )
}

function removeSesionIDB(id: string): void
{
  chatDB.deleteSession(id).catch(e =>
    console.warn('[ChatStore] deleteSession failed:', e),
  )
}

function removeFolderIDB(id: string): void
{
  chatDB.deleteFolder(id).catch(e =>
    console.warn('[ChatStore] deleteFolder failed:', e),
  )
}

export const useChatStore = defineStore('chat', () =>
{
  /* ---------- 响应式状态（初始为空，由 initFromDB 异步填充） ---------- */
  const sessions = ref<ChatSession[]>([])
  const folders = ref<ChatFolder[]>([])
  const currentSessionId = ref<string | null>(null)

  /** IndexedDB 初始化完成标志，外部可 await initReady 来等待加载完毕 */
  let _initResolve: (() => void) | null = null
  const initReady = new Promise<void>(resolve =>
  {
    _initResolve = resolve
  })

  /* ---------- 计算属性 ---------- */

  const currentSession = computed(() =>
    currentSessionId.value
      ? (sessions.value.find(s => s.id === currentSessionId.value) ?? null)
      : null,
  )

  const currentMessages = computed(() => currentSession.value?.messages ?? [])

  const sortedSessions = computed(() =>
    [...sessions.value].sort((a, b) => b.updatedAt - a.updatedAt),
  )

  /** 按 order 升序排列的文件夹 */
  const sortedFolders = computed(() =>
    [...folders.value].sort((a, b) => a.order - b.order),
  )

  /** 获取某个文件夹下的会话（按更新时间倒序） */
  function getSessionsByFolder(folderId: string): ChatSession[]
  {
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

  /* ---------- IndexedDB 初始化（含从 localStorage 的一次性迁移） ---------- */

  async function initFromDB(userId?: string | number | null): Promise<void>
  {
    // 切换到对应用户的 IndexedDB 数据库
    chatDB.setCurrentUser(userId ?? null)

    try
    {
      const [storedSessions, storedFolders] = await Promise.all([
        chatDB.getAllSessions(),
        chatDB.getAllFolders(),
      ])

      if (storedSessions.length > 0 || storedFolders.length > 0)
      {
        // IDB 已有数据，直接使用
        const now = Date.now()
        sessions.value = storedSessions.map((s: any) => ({
          ...s,
          messages: s.messages || [],
          createdAt:
            typeof s.createdAt === 'number' && !Number.isNaN(s.createdAt)
              ? s.createdAt
              : now,
          updatedAt:
            typeof s.updatedAt === 'number' && !Number.isNaN(s.updatedAt)
              ? s.updatedAt
              : now,
        }))
        folders.value = storedFolders
      }
      else
      {
        // IDB 为空，尝试从 localStorage 一次性迁移
        const lsSessions = loadFromStorage()
        const lsFolders = loadFoldersFromStorage()

        if (lsSessions.length > 0 || lsFolders.length > 0)
        {
          sessions.value = lsSessions
          folders.value = lsFolders

          // 批量写入 IDB
          await chatDB.putSessions(lsSessions)
          for (const f of lsFolders)
          
            await chatDB.putFolder(f)
          

          // 迁移成功后清除 localStorage 旧数据
          try
          {
            localStorage.removeItem(STORAGE_KEYS.CHAT_SESSIONS)
          }
          catch
          { /* ignore */ }
          try
          {
            localStorage.removeItem(STORAGE_KEYS.CHAT_FOLDERS)
          }
          catch
          { /* ignore */ }
        }
      }
    }
    catch (e)
    {
      console.error('[ChatStore] initFromDB failed, falling back to localStorage:', e)
      sessions.value = loadFromStorage()
      folders.value = loadFoldersFromStorage()
    }

    // 加载完成后校正 currentSessionId：确保它指向一个有效的 session
    if (
      sessions.value.length > 0 &&
      (!currentSessionId.value || !sessions.value.find(s => s.id === currentSessionId.value))
    )
    {
      // 选中最新更新的 session
      const sorted = [...sessions.value].sort((a, b) => b.updatedAt - a.updatedAt)
      currentSessionId.value = sorted[0].id
    }
    else if (sessions.value.length === 0)
    
      currentSessionId.value = null
    

    // 通知外部：初始化完成
    _initResolve?.()
  }

  // 在 store 被创建时立即执行异步初始化
  const userStore = useUserStore()
  initFromDB((userStore.user as Partial<import('@u-blog/model').IUser>)?.id)

  // 当用户登录/登出切换时，重新加载对应用户的 IndexedDB 数据
  watch(
    () => (userStore.user as Partial<import('@u-blog/model').IUser>)?.id,
    (newId, oldId) =>
    {
      if (newId !== oldId)
      {
        // 先清空当前内存数据，再加载新用户数据
        sessions.value = []
        folders.value = []
        currentSessionId.value = null
        initFromDB(newId)
      }
    },
  )

  /* ---------- 文件夹 CRUD ---------- */

  function createFolder(name: string): string
  {
    const maxOrder = folders.value.reduce((max, f) => Math.max(max, f.order), 0)
    const folder: ChatFolder = {
      id: generateId(),
      name,
      createdAt: Date.now(),
      order: maxOrder + 1,
    }
    folders.value.push(folder)
    persistFolder(folder)
    return folder.id
  }

  function renameFolderById(folderId: string, name: string): void
  {
    const folder = folders.value.find(f => f.id === folderId)
    if (folder)
    {
      folder.name = name
      persistFolder(folder)
    }
  }

  function deleteFolderById(folderId: string): void
  {
    const idx = folders.value.findIndex(f => f.id === folderId)
    if (idx === -1) return
    folders.value.splice(idx, 1)
    removeFolderIDB(folderId)
    // 该文件夹下的会话移至未分类，并持久化
    sessions.value.forEach(s =>
    {
      if (s.folderId === folderId)
      {
        s.folderId = undefined
        persistSession(s)
      }
    })
  }

  function moveSessionToFolder(sessionId: string, folderId: string | null): void
  {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session)
    {
      session.folderId = folderId || undefined
      persistSession(session)
    }
  }

  /* ---------- 会话 CRUD ---------- */

  function createSession(folderId?: string): string
  {
    const session: ChatSession = {
      id: generateId(),
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      folderId: folderId || undefined,
    }
    sessions.value.unshift(session)
    currentSessionId.value = session.id

    if (sessions.value.length > MAX_SESSIONS)
    {
      // 超出上限时移除最老的会话，并同步删除 IDB 记录
      const removed = sessions.value.splice(MAX_SESSIONS)
      removed.forEach(s => removeSesionIDB(s.id))
    }

    persistSession(session)
    return session.id
  }

  function switchSession(sessionId: string): void
  {
    if (sessions.value.find(s => s.id === sessionId))
    
      currentSessionId.value = sessionId
    
  }

  function deleteSession(sessionId: string): void
  {
    const index = sessions.value.findIndex(s => s.id === sessionId)
    if (index !== -1)
    {
      sessions.value.splice(index, 1)
      removeSesionIDB(sessionId)

      if (currentSessionId.value === sessionId)
      {
        currentSessionId.value =
          sessions.value.length > 0 ? sessions.value[0].id : null
      }
    }
  }

  function addMessage(role: 'user' | 'assistant', content: string): void
  {
    if (!currentSessionId.value)
    
      createSession()
    

    const session = sessions.value.find(s => s.id === currentSessionId.value)
    if (!session) return

    if (!session.messages) session.messages = []

    const message: ChatMessage = {
      id: generateId(),
      role,
      content,
      timestamp: Date.now(),
    }

    session.messages.push(message)
    session.updatedAt = Date.now()

    // 第一条用户消息自动生成标题
    if (session.messages.length === 1 && role === 'user')
    
      session.title = generateTitle(content)
    

    persistSession(session)
  }

  /**
   * 向当前会话最后一条消息追加内容（SSE 流式 token 拼接）
   * 高频调用，不立即写 IDB；流结束后调用 flushStorage 统一写入
   */
  function appendToLastMessage(token: string): void
  {
    const session = sessions.value.find(s => s.id === currentSessionId.value)
    if (!session || !session.messages.length) return
    const last = session.messages[session.messages.length - 1]
    last.content += token
    session.updatedAt = Date.now()
  }

  /** 流结束时将当前会话同步到 IndexedDB */
  function flushStorage(): void
  {
    const session = sessions.value.find(s => s.id === currentSessionId.value)
    if (session) persistSession(session)
  }

  function clearCurrentSession(): void
  {
    if (!currentSessionId.value) return
    const session = sessions.value.find(s => s.id === currentSessionId.value)
    if (session)
    {
      session.messages = []
      session.title = '新对话'
      session.updatedAt = Date.now()
      persistSession(session)
    }
  }

  function updateSessionTitle(sessionId: string, title: string): void
  {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session)
    {
      session.title = title
      persistSession(session)
    }
  }

  return {
    // 初始化
    initReady,
    // 会话
    sessions,
    currentSessionId,
    currentSession,
    currentMessages,
    sortedSessions,
    createSession,
    switchSession,
    deleteSession,
    addMessage,
    appendToLastMessage,
    flushStorage,
    clearCurrentSession,
    updateSessionTitle,
    // 文件夹
    folders,
    sortedFolders,
    getSessionsByFolder,
    uncategorizedSessions,
    createFolder,
    renameFolderById,
    deleteFolderById,
    moveSessionToFolder,
  }
})

