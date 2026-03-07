import Redis from 'ioredis'

/**
 * Redis 缓存层
 *
 * 设计要点：
 * 1. 单例模式 — 全局共享同一个 Redis 连接
 * 2. 静默降级 — Redis 不可用时直接穿透到数据库，不影响正常功能
 * 3. 前缀隔离 — 所有 key 统一添加 `ublog:` 前缀，避免与其他服务冲突
 * 4. TTL 分级 — 高频低变接口（overview）缓存 5 分钟，中频接口（列表）缓存 2 分钟
 * 5. 精准失效 — 写操作后按 pattern 批量清除相关缓存
 */

const KEY_PREFIX = 'ublog:'

/** 缓存 TTL 预设（秒） */
export const CacheTTL = {
  /** 站点概览、云词权重等聚合数据 */
  OVERVIEW: 5 * 60,
  /** 文章列表、分类标签等列表数据 */
  LIST: 2 * 60,
  /** 单篇文章详情 */
  DETAIL: 3 * 60,
  /** 全局设置 */
  SETTINGS: 10 * 60,
} as const

let redis: Redis | null = null
let connected = false

/**
 * 初始化 Redis 连接
 * 在应用启动时调用一次即可，连接失败不会阻塞应用
 */
export function initRedis(): Redis | null {
  const host = process.env.REDIS_HOST || '127.0.0.1'
  const port = Number(process.env.REDIS_PORT) || 6379
  const password = process.env.REDIS_PASSWORD || undefined

  try {
    redis = new Redis({
      host,
      port,
      password,
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        // 重连策略：最多重试 5 次，间隔递增，上限 30 秒
        if (times > 5) return null
        return Math.min(times * 2000, 30_000)
      },
      lazyConnect: false,
    })

    redis.on('connect', () => {
      connected = true
      console.log(`✅ Redis 已连接 (${host}:${port})`)
    })

    redis.on('error', (err) => {
      connected = false
      console.warn('⚠️ Redis 连接异常，缓存已降级:', err.message)
    })

    redis.on('close', () => {
      connected = false
    })

    return redis
  } catch (err) {
    console.warn('⚠️ Redis 初始化失败，缓存功能已禁用:', (err as Error).message)
    return null
  }
}

/** 获取 Redis 实例（可能为 null） */
export function getRedis(): Redis | null {
  return connected ? redis : null
}

/** 完整 key（加前缀） */
function fullKey(key: string): string {
  return `${KEY_PREFIX}${key}`
}

/**
 * 读取缓存
 * @returns 命中时返回反序列化后的对象，未命中或 Redis 不可用返回 null
 */
export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  const r = getRedis()
  if (!r) return null
  try {
    const raw = await r.get(fullKey(key))
    return raw ? JSON.parse(raw) as T : null
  } catch {
    return null
  }
}

/**
 * 写入缓存
 * @param key 缓存键
 * @param value 要缓存的数据（自动 JSON 序列化）
 * @param ttl 过期时间（秒），默认 2 分钟
 */
export async function cacheSet(key: string, value: unknown, ttl = CacheTTL.LIST): Promise<void> {
  const r = getRedis()
  if (!r) return
  try {
    await r.set(fullKey(key), JSON.stringify(value), 'EX', ttl)
  } catch {
    // 静默失败
  }
}

/**
 * 删除单个缓存
 */
export async function cacheDel(key: string): Promise<void> {
  const r = getRedis()
  if (!r) return
  try {
    await r.del(fullKey(key))
  } catch {
    // 静默失败
  }
}

/**
 * 按 pattern 批量删除缓存
 * 使用 SCAN 避免阻塞（不使用 KEYS 命令）
 * @param pattern 匹配模式，如 'article:*'
 */
export async function cacheDelByPattern(pattern: string): Promise<void> {
  const r = getRedis()
  if (!r) return
  try {
    const fullPattern = fullKey(pattern)
    let cursor = '0'
    do {
      const [nextCursor, keys] = await r.scan(cursor, 'MATCH', fullPattern, 'COUNT', 100)
      cursor = nextCursor
      if (keys.length > 0) {
        await r.del(...keys)
      }
    } while (cursor !== '0')
  } catch {
    // 静默失败
  }
}

/**
 * 缓存穿透包装器 — 最常用的缓存模式
 *
 * 流程：
 * 1. 尝试从 Redis 获取缓存数据
 * 2. 缓存命中 → 直接返回
 * 3. 缓存未命中 → 调用 fetcher 函数从数据库获取
 * 4. 将结果写入缓存后返回
 *
 * @param key 缓存键
 * @param fetcher 数据获取函数（操作数据库等）
 * @param ttl 过期时间（秒）
 */
export async function cacheWrap<T>(key: string, fetcher: () => Promise<T>, ttl = CacheTTL.LIST): Promise<T> {
  // 先尝试命中缓存
  const cached = await cacheGet<T>(key)
  if (cached !== null) return cached

  // 缓存未命中，从数据源获取
  const data = await fetcher()

  // 异步写入缓存（不阻塞响应）
  cacheSet(key, data, ttl).catch(() => {})

  return data
}

/**
 * 文章相关缓存失效：创建/更新/删除文章时调用
 * 清除：文章列表、概览统计、云词权重、搜索结果
 */
export async function invalidateArticleCache(): Promise<void> {
  await Promise.all([
    cacheDelByPattern('article:*'),
    cacheDel('site-overview'),
    cacheDel('cloud-weights'),
  ])
}

/**
 * 分类/标签相关缓存失效
 */
export async function invalidateTaxonomyCache(): Promise<void> {
  await Promise.all([
    cacheDelByPattern('category:*'),
    cacheDelByPattern('tag:*'),
    cacheDel('site-overview'),
    cacheDel('cloud-weights'),
  ])
}

/**
 * 评论相关缓存失效
 */
export async function invalidateCommentCache(): Promise<void> {
  await Promise.all([
    cacheDelByPattern('comment:*'),
    cacheDel('site-overview'),
  ])
}

/**
 * 设置缓存失效
 */
export async function invalidateSettingsCache(): Promise<void> {
  await cacheDelByPattern('settings:*')
}
