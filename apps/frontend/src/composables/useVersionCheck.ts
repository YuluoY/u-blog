import { ref, onUnmounted } from 'vue'

/**
 * 网站版本检测 Composable
 *
 * 构建时 Vite 生成 version.json（含唯一 hash），前端定时轮询该文件：
 * - 首次加载：记录当前 hash
 * - 后续检测：对比远端 hash，不一致则标记有新版本
 *
 * 注意事项：
 * - 仅在生产环境启用（dev 模式下跳过）
 * - 使用 no-cache 请求头避免 CDN/浏览器缓存干扰
 * - 可见性切换时主动检测（用户切回标签页时立即感知）
 */

/** 默认检测间隔 1 分钟 */
const DEFAULT_INTERVAL_MS = 60 * 1000
/** 首次检测延迟：给首屏渲染留一点缓冲，但避免等待过久 */
const INITIAL_DELAY_MS = 5_000

/** 全局共享状态（多个组件实例共用同一份检测结果） */
const hasNewVersion = ref(false)
const latestBuildTime = ref('')

/** 当前构建 hash：由 Vite define 注入 */
let currentHash: string | null = null

try
{
  currentHash = __BUILD_HASH__
}
catch
{
  // dev 环境或未定义时静默忽略
  currentHash = null
}

/** 获取远端 version.json */
async function fetchRemoteVersion(): Promise<{ hash: string; buildTime: string } | null>
{
  try
  {
    const res = await fetch(`/version.json?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
    if (!res.ok) return null
    return await res.json()
  }
  catch
  {
    return null
  }
}

/** 执行一次版本检查 */
async function checkVersion()
{
  if (!currentHash) return
  const remote = await fetchRemoteVersion()
  if (!remote) return
  if (remote.hash !== currentHash)
  {
    hasNewVersion.value = true
    latestBuildTime.value = remote.buildTime
  }
}

/**
 * 启动版本检测
 * @param intervalMs 轮询间隔（毫秒），默认 5 分钟
 */
export function useVersionCheck(intervalMs = DEFAULT_INTERVAL_MS)
{
  let timer: ReturnType<typeof setInterval> | null = null

  // 仅生产环境启用
  if (import.meta.env.PROD && currentHash)
  {
    // 短暂延迟后首次检测，避免首屏刚渲染完成就立刻发请求
    const delay = setTimeout(() =>
    {
      checkVersion()
      timer = setInterval(checkVersion, intervalMs)
    }, INITIAL_DELAY_MS)

    // 页面可见性切换 / 窗口重新聚焦 / 网络恢复时主动检测
    const onVisibilityChange = () =>
    {
      if (document.visibilityState === 'visible') checkVersion()
    }
    const onFocus = () =>
    {
      checkVersion()
    }
    const onOnline = () =>
    {
      checkVersion()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', onFocus)
    window.addEventListener('online', onOnline)

    onUnmounted(() =>
    {
      clearTimeout(delay)
      if (timer) clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('online', onOnline)
    })
  }

  /** 用户点击刷新后重载页面 */
  function refreshToUpdate()
  {
    window.location.reload()
  }

  /** 暂时忽略本次更新提示 */
  function dismiss()
  {
    hasNewVersion.value = false
  }

  return {
    hasNewVersion,
    latestBuildTime,
    refreshToUpdate,
    dismiss,
  }
}
