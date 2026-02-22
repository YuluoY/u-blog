/**
 * chatDB — 基于 IndexedDB 的聊天数据持久化工具
 * 数据库：u-blog-chat  版本：1
 * 对象存储：sessions（会话）、folders（文件夹）
 */

const DB_PREFIX = 'u-blog-chat'
const DB_VERSION = 1
const STORE_SESSIONS = 'sessions'
const STORE_FOLDERS = 'folders'

/**
 * 当前绑定的用户 ID
 * 通过 setCurrentUser 设置，openDB 会以 `u-blog-chat-{userId}` 命名数据库，
 * 实现不同用户间数据完全隔离。
 */
let _currentUserId: string | number | null = null

/** 单例 DB 实例 Promise，避免多次 open */
let _dbPromise: Promise<IDBDatabase> | null = null

/**
 * 切换当前用户（登录/退出时由 store 调用）
 * 会关闭旧连接，下次操作时自动以新用户 ID 打开对应数据库
 */
export function setCurrentUser(userId: string | number | null): void {
  if (_currentUserId === userId) return
  _currentUserId = userId
  // 关闭旧连接（如果有），让下次 openDB 重新打开正确的 DB
  if (_dbPromise) {
    _dbPromise.then(db => db.close()).catch(() => {})
    _dbPromise = null
  }
}

/** 获取当前数据库名称（含用户 ID 隔离后缀） */
function getDBName(): string {
  return _currentUserId ? `${DB_PREFIX}-${_currentUserId}` : DB_PREFIX
}

function openDB(): Promise<IDBDatabase> {
  if (_dbPromise) return _dbPromise
  _dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(getDBName(), DB_VERSION)

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      // 会话存储
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        const ss = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' })
        ss.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
      // 文件夹存储
      if (!db.objectStoreNames.contains(STORE_FOLDERS)) {
        const fs = db.createObjectStore(STORE_FOLDERS, { keyPath: 'id' })
        fs.createIndex('order', 'order', { unique: false })
      }
    }

    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result)
    req.onerror = (e) => {
      _dbPromise = null // 允许下次重试
      reject((e.target as IDBOpenDBRequest).error)
    }
  })
  return _dbPromise
}

/** IDBRequest 转 Promise */
function toPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// ========== 会话 ==========

/** 获取所有会话（批量） */
export async function getAllSessions(): Promise<any[]> {
  const db = await openDB()
  const tx = db.transaction(STORE_SESSIONS, 'readonly')
  return toPromise(tx.objectStore(STORE_SESSIONS).getAll())
}

/** 写入（新增或更新）单条会话 */
export async function putSession(session: any): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_SESSIONS, 'readwrite')
  await toPromise(tx.objectStore(STORE_SESSIONS).put(session))
}

/**
 * 批量覆写所有会话（先清空再写入）
 * 用于 localStorage 迁移，或整体重置场景
 */
export async function putSessions(sessions: any[]): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_SESSIONS, 'readwrite')
  const store = tx.objectStore(STORE_SESSIONS)
  store.clear()
  for (const s of sessions) {
    store.put(s)
  }
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** 删除单条会话 */
export async function deleteSession(id: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_SESSIONS, 'readwrite')
  await toPromise(tx.objectStore(STORE_SESSIONS).delete(id))
}

// ========== 文件夹 ==========

/** 获取所有文件夹 */
export async function getAllFolders(): Promise<any[]> {
  const db = await openDB()
  const tx = db.transaction(STORE_FOLDERS, 'readonly')
  return toPromise(tx.objectStore(STORE_FOLDERS).getAll())
}

/** 写入（新增或更新）单条文件夹 */
export async function putFolder(folder: any): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_FOLDERS, 'readwrite')
  await toPromise(tx.objectStore(STORE_FOLDERS).put(folder))
}

/** 删除单条文件夹 */
export async function deleteFolder(id: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_FOLDERS, 'readwrite')
  await toPromise(tx.objectStore(STORE_FOLDERS).delete(id))
}
