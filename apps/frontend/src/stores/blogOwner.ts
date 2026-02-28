import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserBlogProfile, type UserBlogProfile } from '@/api/userBlog'
import { useHeaderStore } from './header'

/**
 * 博客拥有者 Store — 子域名博客隔离
 *
 * 检测子域名（如 zhangsan.example.com）或 ?blogger=xxx 查询参数，
 * 自动加载该用户的公开资料，使全站仅展示该用户的数据。
 *
 * 核心属性：
 * - `blogOwnerId` — 博客拥有者 userId（用于 API 过滤）
 * - `isSubdomainMode` — 是否处于子域名博客模式
 * - `profile` — 完整的用户公开资料（头像、设置、统计）
 */
export const useBlogOwnerStore = defineStore('blogOwner', () => {
  /** 子域名中提取的用户名 */
  const ownerUsername = ref<string | null>(null)
  /** 博客拥有者公开资料 */
  const profile = ref<UserBlogProfile | null>(null)
  /** 是否正在加载 */
  const loading = ref(false)
  /** 加载错误信息 */
  const error = ref<string | null>(null)
  /** 初始化是否已完成（路由守卫可等待） */
  const ready = ref(false)

  /** 是否处于子域名博客模式 */
  const isSubdomainMode = computed(() => !!ownerUsername.value && !!profile.value)

  /** 博客拥有者的 userId，用于 API 数据过滤 */
  const blogOwnerId = computed<number | undefined>(() =>
    profile.value?.user?.id as number | undefined
  )

  /**
   * 是否为只读模式（子域名博客下根据服务端设置判断）
   * 默认：readonly（只读），仅当博主在服务端设置 blog_share_mode = 'full' 时开放全功能
   * 安全：该值来自服务端 user_setting 表，无法被访客篡改
   */
  const isReadOnly = computed(() => {
    if (!isSubdomainMode.value) return false
    return profile.value?.settings?.blog_share_mode !== 'full'
  })

  /** 博客拥有者头像 */
  const ownerAvatar = computed(() => profile.value?.user?.avatar || '')

  /** 博客拥有者站点名称（从个人设置中获取） */
  const ownerSiteName = computed(() => {
    const settings = profile.value?.settings
    if (settings && typeof settings.site_name === 'string') return settings.site_name
    // 回退：用户昵称 + "的博客"
    const name = profile.value?.user?.namec || profile.value?.user?.username
    return name ? `${name}的博客` : ''
  })

  /**
   * 从当前 URL 检测子域名或 ?blogger 参数
   * @returns 提取到的用户名，或 null
   */
  function detectSubdomain(): string | null {
    const hostname = window.location.hostname

    // 1. 开发环境 ?blogger=xxx 参数优先（方便本地调试）
    const params = new URLSearchParams(window.location.search)
    const bloggerParam = params.get('blogger')
    if (bloggerParam) return bloggerParam.trim()

    // 2. 子域名检测
    // localhost / IP 地址不含子域名
    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return null
    }

    // 解析主域名层级：a.b.example.com → parts = ['a', 'b', 'example', 'com']
    const parts = hostname.split('.')

    // 至少需要 3 级（sub.example.com）
    if (parts.length < 3) return null

    // 子域名 = 第一段（排除 www）
    const sub = parts[0].toLowerCase()
    if (sub === 'www') return null

    return sub
  }

  /**
   * 初始化：检测子域名并加载博客拥有者资料
   * 应在 app 启动（router beforeEach 或 App.vue onMounted）中调用
   */
  async function init() {
    if (ready.value) return

    const username = detectSubdomain()
    if (!username) {
      ready.value = true
      return
    }

    ownerUsername.value = username
    loading.value = true
    error.value = null

    try {
      const data = await getUserBlogProfile(username)
      profile.value = data

      // 覆盖 header store 的站点名，logo 统一使用 /logo.svg
      const headerStore = useHeaderStore()
      headerStore.setLogo('/logo.svg')
      if (ownerSiteName.value) {
        headerStore.setSiteName(ownerSiteName.value)
      }
    } catch (e: any) {
      error.value = e?.message || '加载博客信息失败'
      // 子域名用户不存在时清除，回退到默认模式
      ownerUsername.value = null
      profile.value = null
    } finally {
      loading.value = false
      ready.value = true
    }
  }

  /**
   * 生成当前用户的分享链接（子域名格式）
   * @param username 用户名
   * @returns 分享链接 URL
   */
  function buildShareUrl(username: string): string {
    const { protocol, hostname, port } = window.location

    // 开发环境：使用 ?blogger 参数
    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      const portStr = port ? `:${port}` : ''
      return `${protocol}//${hostname}${portStr}?blogger=${username}`
    }

    // 生产环境：子域名格式
    // 去掉已有的子域名（如果有），拼接新的
    const parts = hostname.split('.')
    // 如果当前就在子域名下，替换第一段；否则添加
    let baseDomain: string
    if (parts.length >= 3 && parts[0] !== 'www') {
      baseDomain = parts.slice(1).join('.')
    } else if (parts[0] === 'www') {
      baseDomain = parts.slice(1).join('.')
    } else {
      baseDomain = hostname
    }

    const portStr = port && port !== '80' && port !== '443' ? `:${port}` : ''
    return `${protocol}//${username}.${baseDomain}${portStr}`
  }

  return {
    // 状态
    ownerUsername,
    profile,
    loading,
    error,
    ready,
    // 计算属性
    isSubdomainMode,
    blogOwnerId,
    isReadOnly,
    ownerAvatar,
    ownerSiteName,
    // 方法
    init,
    detectSubdomain,
    buildShareUrl,
  }
})
