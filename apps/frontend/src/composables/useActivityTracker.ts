import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAccessToken } from '@/api/request'

/** 前端上报事件 DTO */
interface TrackEvent {
  type: string
  sessionId?: string
  path?: string
  referer?: string
  metadata?: Record<string, unknown>
  duration?: number
}

/** 追踪 API 地址 */
const TRACK_URL = '/api/activity/track'

/** 批量上报间隔（毫秒） */
const FLUSH_INTERVAL = 10_000

/** 最大缓冲事件数，超过立即刷新 */
const MAX_BUFFER_SIZE = 20

/** 短窗口重复事件抑制时间（毫秒） */
const EVENT_DEDUP_WINDOW_MS = 1500

/** 获取或创建 sessionId */
function getSessionId(): string
{
  const KEY = 'u_session_id'
  let sid = sessionStorage.getItem(KEY)
  if (!sid)
  {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    sessionStorage.setItem(KEY, sid)
  }
  return sid
}

/** 事件缓冲区 */
let buffer: TrackEvent[] = []
let flushTimer: ReturnType<typeof setInterval> | null = null

/** 最近事件指纹（用于抑制短时间重复上报） */
const recentEventMap = new Map<string, number>()

/** 页面进入时间 */
let pageEnterTime = 0
let currentPath = ''

/** 页面浏览最小有效停留时长（毫秒），过滤重定向等瞬时页面 */
const MIN_PAGE_VIEW_DURATION = 500

const sessionId = getSessionId()

function sortObjectKeys(value: unknown): unknown
{
  if (Array.isArray(value)) return value.map(sortObjectKeys)
  if (value && typeof value === 'object')
  {
    const obj = value as Record<string, unknown>
    return Object.keys(obj).sort().reduce<Record<string, unknown>>((acc, key) =>
    {
      acc[key] = sortObjectKeys(obj[key])
      return acc
    }, {})
  }
  return value
}

function buildEventFingerprint(dto: Omit<TrackEvent, 'sessionId'>): string
{
  const payload = {
    type: dto.type,
    path: dto.path ?? '',
    referer: dto.referer ?? '',
    duration: dto.duration ?? null,
    metadata: sortObjectKeys(dto.metadata ?? null),
  }
  return JSON.stringify(payload)
}

function shouldDropDuplicate(dto: Omit<TrackEvent, 'sessionId'>): boolean
{
  const now = Date.now()
  for (const [fingerprint, ts] of recentEventMap)
  
    if (now - ts > EVENT_DEDUP_WINDOW_MS) recentEventMap.delete(fingerprint)
  

  const fingerprint = buildEventFingerprint(dto)
  const lastTs = recentEventMap.get(fingerprint)
  if (lastTs && now - lastTs <= EVENT_DEDUP_WINDOW_MS)
  
    return true
  

  recentEventMap.set(fingerprint, now)
  return false
}

/** 入队一条事件 */
function enqueue(dto: Omit<TrackEvent, 'sessionId'>)
{
  if (shouldDropDuplicate(dto)) return
  buffer.push({ ...dto, sessionId })
  if (buffer.length >= MAX_BUFFER_SIZE) flush()
}

/** 把缓冲区发送到后端（使用 fetch + keepalive 替代 sendBeacon 以携带 JWT 认证头） */
function flush()
{
  if (!buffer.length) return
  const events = [...buffer]
  buffer = []

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getAccessToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  fetch(TRACK_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ events }),
    keepalive: true, // 确保页面卸载时请求仍能完成
  }).catch(() =>
  {})
}

/** 结束当前页面的停留统计 */
function finishPageView()
{
  if (!currentPath || !pageEnterTime) return
  const duration = Math.round(Date.now() - pageEnterTime)
  if (duration > MIN_PAGE_VIEW_DURATION)
  {
    // 仅在离开页面时写入一条 page_view，避免同次访问重复记录
    enqueue({ type: 'page_view', path: currentPath, duration, referer: document.referrer })
  }
  currentPath = ''
  pageEnterTime = 0
}

/** 开始记录新页面 */
function startPageView(path: string)
{
  // 同一路径重复触发（如初始导航 + 可见性恢复）直接忽略
  if (currentPath === path && pageEnterTime) return

  finishPageView()
  currentPath = path
  pageEnterTime = Date.now()
}

/**
 * 在 App.vue 的 setup 中调用一次即可
 * 自动追踪路由切换 + 页面关闭 + 可见性变化
 */
export function useActivityTracker()
{
  const router = useRouter()

  onMounted(() =>
  {
    // 初始页面
    startPageView(window.location.pathname)

    // 定时刷新缓冲区
    flushTimer = setInterval(flush, FLUSH_INTERVAL)
  })

  // 路由切换
  const removeGuard = router.afterEach(to =>
  {
    startPageView(to.fullPath)
  })

  // 页面可见性变化：隐藏时结束当前页计时并刷新
  function onVisibility()
  {
    if (document.hidden)
    {
      // 仅刷新缓冲区，不在 hidden/visible 切换时切断一次页面访问
      flush()
    }
    else
    {
      // 兜底：当当前无活跃页面计时时（例如异常恢复）再重启计时
      if (!currentPath || !pageEnterTime)
      
        startPageView(window.location.pathname)
      
    }
  }

  // 页面关闭 / 卸载
  function onBeforeUnload()
  {
    finishPageView()
    flush()
  }

  onMounted(() =>
  {
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('beforeunload', onBeforeUnload)
  })

  onUnmounted(() =>
  {
    removeGuard()
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('beforeunload', onBeforeUnload)
    if (flushTimer) clearInterval(flushTimer)
    finishPageView()
    flush()
  })
}

/* ---------- 手动追踪方法，供组件按需调用 ---------- */

/** 追踪文章阅读 */
export function trackArticleView(articleId: number, title?: string)
{
  enqueue({
    type: 'article_view',
    path: window.location.pathname,
    metadata: { articleId, title },
  })
}

/** 追踪搜索 */
export function trackSearch(keyword: string)
{
  enqueue({
    type: 'search',
    path: window.location.pathname,
    metadata: { keyword },
  })
}

/** 追踪文章点赞 */
export function trackArticleLike(articleId: number)
{
  enqueue({
    type: 'article_like',
    path: window.location.pathname,
    metadata: { articleId },
  })
}

/** 追踪分享 */
export function trackShare(articleId: number, platform?: string)
{
  enqueue({
    type: 'article_share',
    path: window.location.pathname,
    metadata: { articleId, platform },
  })
}

/** 追踪登录 */
export function trackLogin()
{
  enqueue({ type: 'login', path: window.location.pathname })
}

/** 追踪注册 */
export function trackRegister()
{
  enqueue({ type: 'register', path: window.location.pathname })
}

/** 追踪登出 */
export function trackLogout()
{
  enqueue({ type: 'logout', path: window.location.pathname })
  flush() // 登出立即发送
}

/** 通用点击追踪 */
export function trackClick(target: string, extra?: Record<string, unknown>)
{
  enqueue({
    type: 'click',
    path: window.location.pathname,
    metadata: { target, ...extra },
  })
}

/** 通用评论追踪 */
export function trackComment(articleId: number)
{
  enqueue({
    type: 'comment',
    path: window.location.pathname,
    metadata: { articleId },
  })
}
