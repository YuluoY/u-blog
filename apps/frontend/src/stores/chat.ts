import { STORAGE_KEYS } from '@/constants/storage'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
}
const MAX_SESSIONS = 50

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function generateTitle(firstMessage: string): string {
  const title = firstMessage.trim().slice(0, 30)
  return title.length < firstMessage.trim().length ? `${title}...` : title
}

function loadFromStorage(): ChatSession[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS)
    const sessions = data ? JSON.parse(data) : []
    
    const now = Date.now()
    return sessions.map((session: any) => {
      const ts = typeof session.updatedAt === 'number' && !Number.isNaN(session.updatedAt)
        ? session.updatedAt
        : (typeof session.createdAt === 'number' && !Number.isNaN(session.createdAt) ? session.createdAt : now)
      return {
        ...session,
        messages: session.messages || [],
        createdAt: typeof session.createdAt === 'number' && !Number.isNaN(session.createdAt) ? session.createdAt : now,
        updatedAt: ts
      }
    })
  } catch (e) {
    console.error('Failed to load chat sessions from storage:', e)
    return []
  }
}

function saveToStorage(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(sessions))
  } catch (e) {
    console.error('Failed to save chat sessions to storage:', e)
  }
}

export const useChatStore = defineStore('chat', () => {
  const sessions = ref<ChatSession[]>(loadFromStorage())
  const currentSessionId = ref<string | null>(null)

  const currentSession = computed(() => {
    if (!currentSessionId.value) return null
    return sessions.value.find(s => s.id === currentSessionId.value) || null
  })

  const currentMessages = computed(() => {
    return currentSession.value?.messages || []
  })

  const sortedSessions = computed(() => {
    return [...sessions.value].sort((a, b) => b.updatedAt - a.updatedAt)
  })

  function createSession(): string {
    const session: ChatSession = {
      id: generateId(),
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    sessions.value.unshift(session)
    currentSessionId.value = session.id
    
    if (sessions.value.length > MAX_SESSIONS) {
      sessions.value = sessions.value.slice(0, MAX_SESSIONS)
    }
    
    saveToStorage(sessions.value)
    return session.id
  }

  function switchSession(sessionId: string): void {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      currentSessionId.value = sessionId
    }
  }

  function deleteSession(sessionId: string): void {
    const index = sessions.value.findIndex(s => s.id === sessionId)
    if (index !== -1) {
      sessions.value.splice(index, 1)
      
      if (currentSessionId.value === sessionId) {
        currentSessionId.value = sessions.value.length > 0 ? sessions.value[0].id : null
      }
      
      saveToStorage(sessions.value)
    }
  }

  function addMessage(role: 'user' | 'assistant', content: string): void {
    if (!currentSessionId.value) {
      const newId = createSession()
      currentSessionId.value = newId
    }

    const session = sessions.value.find(s => s.id === currentSessionId.value)
    if (!session) return

    // 确保 messages 数组存在
    if (!session.messages) {
      session.messages = []
    }

    const message: ChatMessage = {
      id: generateId(),
      role,
      content,
      timestamp: Date.now()
    }

    session.messages.push(message)
    session.updatedAt = Date.now()

    if (session.messages.length === 1 && role === 'user') {
      session.title = generateTitle(content)
    }

    saveToStorage(sessions.value)
  }

  function clearCurrentSession(): void {
    if (!currentSessionId.value) return
    
    const session = sessions.value.find(s => s.id === currentSessionId.value)
    if (session) {
      session.messages = []
      session.title = '新对话'
      session.updatedAt = Date.now()
      saveToStorage(sessions.value)
    }
  }

  function updateSessionTitle(sessionId: string, title: string): void {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      session.title = title
      saveToStorage(sessions.value)
    }
  }

  return {
    sessions,
    currentSessionId,
    currentSession,
    currentMessages,
    sortedSessions,
    createSession,
    switchSession,
    deleteSession,
    addMessage,
    clearCurrentSession,
    updateSessionTitle
  }
})
