/**
 * 发布配置 IndexedDB 封装
 * 库名 u-blog-write-{userId}，store publish-settings，主键 id（当前配置为 'current'）
 * 与草稿 DB 共用同一数据库，通过 store 隔离
 */

const DB_PREFIX = 'u-blog-write'
const STORE_NAME = 'publish-settings'
const CURRENT_KEY = 'current'
/** 版本必须 >= 已有版本（drafts store 在 v1 创建），升级为 v2 新增 publish-settings store */
const DB_VERSION = 2

/** 当前绑定的用户 ID */
let _currentUserId: string | number | null = null
/** 单例 DB 实例 Promise */
let _dbPromise: Promise<IDBDatabase> | null = null

/** 切换当前用户（登录/退出时调用） */
export function setCurrentUser(userId: string | number | null): void {
  if (_currentUserId === userId) return
  _currentUserId = userId
  if (_dbPromise) {
    _dbPromise.then(db => db.close()).catch(() => {})
    _dbPromise = null
  }
}

/** 获取当前数据库名称（含用户 ID 隔离后缀） */
function getDBName(): string {
  return _currentUserId ? `${DB_PREFIX}-${_currentUserId}` : DB_PREFIX
}

export interface PublishSettingsRecord {
  id: string
  title: string
  desc: string
  categoryId: number | null
  tags: number[]
  status: string
  isPrivate: boolean
  isTop: boolean
  cover: string
  coverMediaId: number | null
  publishedAt: string
  publishNow: boolean
  coverUrlMode: boolean
  /** 是否启用密码保护 */
  isProtected: boolean
  /** 密码保护密码（明文缓存在本地，提交时加密） */
  protectPassword: string
  updatedAt: number
}

function openDB(): Promise<IDBDatabase> {
  if (_dbPromise) return _dbPromise
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(getDBName(), DB_VERSION)
    req.onerror = () => {
      _dbPromise = null
      reject(req.error)
    }
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      // v1 创建的 drafts store 保留
      if (!db.objectStoreNames.contains('drafts')) {
        db.createObjectStore('drafts', { keyPath: 'id' })
      }
      // v2 新增 publish-settings store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
  return _dbPromise
}

/**
 * 读取当前发布配置
 */
export async function getPublishSettings(): Promise<PublishSettingsRecord | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(CURRENT_KEY)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result ?? null)
  })
}

/**
 * 写入发布配置（fire-and-forget 或 await）
 */
export async function putPublishSettings(
  data: Omit<PublishSettingsRecord, 'id' | 'updatedAt'>
): Promise<void> {
  const db = await openDB()
  const record: PublishSettingsRecord = {
    ...data,
    id: CURRENT_KEY,
    updatedAt: Date.now(),
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.put(record)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve()
  })
}

/**
 * 清除发布配置（发布成功后调用）
 */
export async function clearPublishSettings(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.delete(CURRENT_KEY)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve()
  })
}
