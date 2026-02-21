/**
 * 发布配置 IndexedDB 封装
 * 库名 u-blog-write，store publish-settings，主键 id（当前配置为 'current'）
 * 与草稿 DB 共用同一数据库，通过 store 隔离
 */

const DB_NAME = 'u-blog-write'
const STORE_NAME = 'publish-settings'
const CURRENT_KEY = 'current'
/** 版本必须 >= 已有版本（drafts store 在 v1 创建），升级为 v2 新增 publish-settings store */
const DB_VERSION = 2

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
  updatedAt: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
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
    req.onerror = () => { db.close(); reject(req.error) }
    req.onsuccess = () => { db.close(); resolve(req.result ?? null) }
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
    req.onerror = () => { db.close(); reject(req.error) }
    req.onsuccess = () => { db.close(); resolve() }
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
    req.onerror = () => { db.close(); reject(req.error) }
    req.onsuccess = () => { db.close(); resolve() }
  })
}
