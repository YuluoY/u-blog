/**
 * 撰写页草稿 IndexedDB 封装
 * 库名 u-blog-write-{userId}，store drafts，主键 id（当前草稿为 'current'）
 * 注意：与 publishSettingsDb 共用同一数据库，版本升级时需同步 store 创建
 */

const DB_PREFIX = 'u-blog-write'
const STORE_NAME = 'drafts'
const CURRENT_DRAFT_ID = 'current'
/** v2: 新增 publish-settings store，两个工具文件必须使用同一版本号 */
const DB_VERSION = 2

/** 当前绑定的用户 ID */
let _currentUserId: string | number | null = null
/** 单例 DB 实例 Promise */
let _dbPromise: Promise<IDBDatabase> | null = null

/** 切换当前用户（登录/退出时调用） */
export function setCurrentUser(userId: string | number | null): void
{
  if (_currentUserId === userId) return
  _currentUserId = userId
  if (_dbPromise)
  {
    _dbPromise.then(db => db.close()).catch(() =>
    {})
    _dbPromise = null
  }
}

/** 获取当前数据库名称（含用户 ID 隔离后缀） */
function getDBName(): string
{
  return _currentUserId ? `${DB_PREFIX}-${_currentUserId}` : DB_PREFIX
}

export interface DraftRecord {
  id: string
  content: string
  updatedAt: number
}

function openDB(): Promise<IDBDatabase>
{
  if (_dbPromise) return _dbPromise
  _dbPromise = new Promise((resolve, reject) =>
  {
    const req = indexedDB.open(getDBName(), DB_VERSION)
    req.onerror = () =>
    {
      _dbPromise = null
      reject(req.error)
    }
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = e =>
    {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME))
      
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      
      // v2 新增 publish-settings store
      if (!db.objectStoreNames.contains('publish-settings'))
      
        db.createObjectStore('publish-settings', { keyPath: 'id' })
      
    }
  })
  return _dbPromise
}

/**
 * 从 IndexedDB 读取当前草稿
 */
export async function getDraft(): Promise<DraftRecord | null>
{
  const db = await openDB()
  return new Promise((resolve, reject) =>
  {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(CURRENT_DRAFT_ID)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result ?? null)
  })
}

/**
 * 写入当前草稿（fire-and-forget 或 await）
 */
export async function putDraft(content: string): Promise<void>
{
  const db = await openDB()
  const record: DraftRecord = {
    id: CURRENT_DRAFT_ID,
    content,
    updatedAt: Date.now()
  }
  return new Promise((resolve, reject) =>
  {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.put(record)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve()
  })
}

/**
 * 从 localStorage 迁移草稿到 IndexedDB，迁移后删除 localStorage 键
 */
export async function migrateDraftFromLocalStorage(
  getLocalDraft: () => string
): Promise<boolean>
{
  const raw = getLocalDraft()
  if (raw === '') return false
  await putDraft(raw)
  return true
}
