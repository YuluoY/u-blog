import { watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'

/**
 * SEO 元信息管理 Composable
 *
 * 功能：
 * 1. 动态设置 document.title、meta description、keywords
 * 2. 设置 Open Graph 标签（og:title, og:description, og:image, og:url, og:type）
 * 3. 设置 Twitter Card 标签
 * 4. 注入 JSON-LD 结构化数据（Schema.org）
 * 5. 设置 canonical URL 避免重复页面
 *
 * 边缘情况处理：
 * - 组件卸载时自动清理注入的标签，避免内存泄漏和标签残留
 * - 同一 name/property 的 meta 标签会复用而非重复创建
 * - JSON-LD script 通过唯一 id 确保不重复插入
 */

/** SEO 配置项 */
export interface SeoOptions {
  /** 页面标题（不含站点后缀，自动拼接） */
  title?: string
  /** 页面描述（推荐 70-160 字符） */
  description?: string
  /** 关键词（逗号分隔） */
  keywords?: string
  /** OG 图片（文章封面等） */
  image?: string
  /** 页面类型：article / website */
  type?: 'article' | 'website'
  /** 作者 */
  author?: string
  /** 发布时间 ISO 8601 */
  publishedTime?: string
  /** 更新时间 ISO 8601 */
  modifiedTime?: string
  /** JSON-LD 结构化数据对象 */
  jsonLd?: Record<string, any>
  /** 是否设置 noindex（登录页、设置页等不希望被收录的页面） */
  noindex?: boolean
}

/** 管理器内部追踪已创建的标签，卸载时清理 */
const createdElements: HTMLElement[] = []

/**
 * 设置或更新 <meta> 标签
 * 策略：先查找已有同 name/property 的标签并复用，避免重复创建
 */
function setMeta(attr: 'name' | 'property', key: string, content: string): HTMLElement | null
{
  if (!content) return null
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (el)
  {
    el.setAttribute('content', content)
    return null // 复用已有标签，不需要追踪清理
  }
  el = document.createElement('meta')
  el.setAttribute(attr, key)
  el.setAttribute('content', content)
  document.head.appendChild(el)
  return el
}

/**
 * 设置 canonical link 标签
 */
function setCanonical(url: string): HTMLElement | null
{
  if (!url) return null
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (el)
  {
    el.href = url
    return null
  }
  el = document.createElement('link')
  el.rel = 'canonical'
  el.href = url
  document.head.appendChild(el)
  return el
}

/**
 * 注入 JSON-LD 结构化数据
 */
function setJsonLd(data: Record<string, any>): HTMLElement | null
{
  if (!data) return null
  const id = 'seo-json-ld'
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (el)
  {
    el.textContent = JSON.stringify(data)
    return null
  }
  el = document.createElement('script')
  el.id = id
  el.type = 'application/ld+json'
  el.textContent = JSON.stringify(data)
  document.head.appendChild(el)
  return el
}

/** 清理所有本次 composable 创建的标签 */
function cleanup()
{
  createdElements.forEach(el =>
  {
    try
    {
      el.parentNode?.removeChild(el)
    }
    catch
    { /* 已被移除 */ }
  })
  createdElements.length = 0
}

/** 站点 URL */
const SITE_URL = 'https://uluo.cloud'

/**
 * 使用 SEO 元信息管理
 *
 * @example
 * ```ts
 * // 静态页面
 * useSeo({ title: '归档', description: '文章归档列表' })
 *
 * // 文章页（动态数据，使用 watchSource）
 * useSeo(() => ({
 *   title: article.value?.title,
 *   description: article.value?.desc,
 *   image: article.value?.cover,
 *   type: 'article',
 *   publishedTime: article.value?.publishedAt,
 *   jsonLd: articleJsonLd.value,
 * }))
 * ```
 */
export function useSeo(optionsOrGetter: SeoOptions | (() => SeoOptions))
{
  const route = useRoute()
  const appStore = useAppStore()

  function apply(opts: SeoOptions)
  {
    // 先清理上次创建的标签
    cleanup()

    const siteName = appStore.siteName || 'U-Blog'
    const currentUrl = `${SITE_URL}${route.fullPath}`

    // 1. document.title
    if (opts.title)
    
      document.title = `${opts.title} - ${siteName}`
    

    // 2. 基础 meta 标签
    const newElements: (HTMLElement | null)[] = []

    newElements.push(setMeta('name', 'description', opts.description || ''))
    newElements.push(setMeta('name', 'keywords', opts.keywords || ''))
    newElements.push(setMeta('name', 'author', opts.author || ''))

    // noindex 控制
    if (opts.noindex)
    
      newElements.push(setMeta('name', 'robots', 'noindex, nofollow'))
    
    else
    {
      // 确保可索引页面有正确的 robots 标签
      newElements.push(setMeta('name', 'robots', 'index, follow'))
    }

    // 3. Open Graph 标签（百度、微信、QQ 都会读取）
    newElements.push(setMeta('property', 'og:title', opts.title || siteName))
    newElements.push(setMeta('property', 'og:description', opts.description || ''))
    newElements.push(setMeta('property', 'og:type', opts.type || 'website'))
    newElements.push(setMeta('property', 'og:url', currentUrl))
    newElements.push(setMeta('property', 'og:site_name', siteName))

    if (opts.image)
    {
      const imgUrl = opts.image.startsWith('http') ? opts.image : `${SITE_URL}${opts.image}`
      newElements.push(setMeta('property', 'og:image', imgUrl))
    }

    // 文章类型的专属 OG 标签
    if (opts.type === 'article')
    {
      if (opts.publishedTime)
      
        newElements.push(setMeta('property', 'article:published_time', opts.publishedTime))
      
      if (opts.modifiedTime)
      
        newElements.push(setMeta('property', 'article:modified_time', opts.modifiedTime))
      
      if (opts.author)
      
        newElements.push(setMeta('property', 'article:author', opts.author))
      
    }

    // 4. Twitter Card（兼容 X/Twitter 分享卡片）
    newElements.push(setMeta('name', 'twitter:card', opts.image ? 'summary_large_image' : 'summary'))
    newElements.push(setMeta('name', 'twitter:title', opts.title || siteName))
    newElements.push(setMeta('name', 'twitter:description', opts.description || ''))
    if (opts.image)
    {
      const imgUrl = opts.image.startsWith('http') ? opts.image : `${SITE_URL}${opts.image}`
      newElements.push(setMeta('name', 'twitter:image', imgUrl))
    }

    // 5. Canonical URL
    newElements.push(setCanonical(currentUrl))

    // 6. JSON-LD 结构化数据
    if (opts.jsonLd)
    
      newElements.push(setJsonLd(opts.jsonLd))
    

    // 收集新创建的标签
    newElements.forEach(el =>
    {
      if (el) createdElements.push(el)
    })
  }

  if (typeof optionsOrGetter === 'function')
  {
    // 响应式模式：watch getter 变化自动更新
    watch(optionsOrGetter, newOpts =>
    {
      if (newOpts.title) apply(newOpts)
    }, { immediate: true, deep: true })
  }
  else
  {
    // 静态模式：直接应用
    apply(optionsOrGetter)
  }

  // 组件卸载时清理
  onUnmounted(cleanup)
}

/**
 * 生成文章页的 JSON-LD 结构化数据（Schema.org Article）
 * 百度搜索结构化数据支持 Article 类型
 */
export function buildArticleJsonLd(article: {
  title: string
  desc?: string | null
  cover?: string | null
  publishedAt: string | Date
  updatedAt?: string | Date | null
  viewCount?: number
  likeCount?: number
  commentCount?: number
  user?: { username?: string; namec?: string } | null
  category?: { name?: string } | null
  tags?: { name?: string }[] | null
  id: number
}): Record<string, any>
{
  const authorName = article.user?.namec || article.user?.username || 'Anonymous'
  const coverUrl = article.cover
    ? (article.cover.startsWith('http') ? article.cover : `${SITE_URL}${article.cover}`)
    : `${SITE_URL}/logo.svg`

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': article.title,
    'description': article.desc || article.title,
    'image': coverUrl,
    'datePublished': new Date(article.publishedAt).toISOString(),
    'dateModified': article.updatedAt
      ? new Date(article.updatedAt).toISOString()
      : new Date(article.publishedAt).toISOString(),
    'author': {
      '@type': 'Person',
      'name': authorName,
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'U-Blog',
      'logo': {
        '@type': 'ImageObject',
        'url': `${SITE_URL}/logo.svg`,
      },
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/read/${article.id}`,
    },
    // 百度支持的额外字段
    ...(article.category?.name ? { 'articleSection': article.category.name } : {}),
    ...(article.tags?.length ? { 'keywords': article.tags.map(t => t.name).join(',') } : {}),
    'interactionStatistic': [
      {
        '@type': 'InteractionCounter',
        'interactionType': 'https://schema.org/ReadAction',
        'userInteractionCount': article.viewCount || 0,
      },
      {
        '@type': 'InteractionCounter',
        'interactionType': 'https://schema.org/LikeAction',
        'userInteractionCount': article.likeCount || 0,
      },
      {
        '@type': 'InteractionCounter',
        'interactionType': 'https://schema.org/CommentAction',
        'userInteractionCount': article.commentCount || 0,
      },
    ],
  }
}

/**
 * 生成面包屑导航的 JSON-LD（帮助搜索引擎理解页面层级）
 */
export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]): Record<string, any>
{
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  }
}
