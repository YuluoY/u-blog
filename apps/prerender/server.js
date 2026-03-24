/**
 * Prerender 服务 — 基于 Puppeteer（自带 Chromium）
 *
 * 为搜索引擎爬虫渲染 SPA 页面返回完整 HTML。
 *
 * 端口：3010（Nginx 反向代理到此端口）
 *
 * 核心策略：
 * 1. 单浏览器实例复用 + 并发控制（最多 3 个 tab）
 * 2. 文件缓存 24h 自动过期
 * 3. 黑名单路径跳过渲染
 * 4. 拦截图片/字体资源请求减少渲染开销
 * 5. 移除非 JSON-LD 的 <script> 标签减小返回体积
 * 6. 文章页面：从后端 API 直接获取文章数据，注入正文内容 + 修正 SEO meta 标签
 */

const express = require('express')
const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

/* ============================================================
 * 配置
 * ============================================================ */

const PORT = process.env.PRERENDER_PORT || 3010
const SITE_URL = process.env.SITE_URL || 'https://uluo.cloud'
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3000'
const CRAWLER_TRACK_KEY = process.env.CRAWLER_TRACK_KEY || ''
const CACHE_DIR = path.resolve(__dirname, 'cache')
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 小时
// 缓存版本号：当预渲染 HTML 结构发生重要变化时递增，避免旧缓存继续污染抓取结果
const CACHE_SCHEMA_VERSION = 'seo-v2'
const MAX_CONCURRENT = 3 // 最大并发渲染数
const PAGE_TIMEOUT = 20_000 // 页面加载超时 20s
const NETWORK_IDLE_WAIT = 1500 // 网络空闲后再等 1.5s
const RECENT_DISCOVERY_LIMIT = 60 // 首页/详情页注入最近文章直链，增强 URL 发现能力

/** 不需要预渲染的路径前缀 */
const BLACKLIST = ['/api/', '/admin/', '/login', '/write', '/chat', '/xiaohui']

/** 拦截的资源类型（爬虫不需要） */
const BLOCKED_RESOURCE_TYPES = new Set(['image', 'media', 'font'])

/* ============================================================
 * 缓存工具
 * ============================================================ */

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
}

function getCacheKey(url) {
  const normalized = url.replace(/#.*$/, '').replace(/\/+$/, '')
  return crypto.createHash('md5').update(`${CACHE_SCHEMA_VERSION}:${normalized}`).digest('hex')
}

function getCachePath(url) {
  return path.join(CACHE_DIR, getCacheKey(url) + '.html')
}

function readCache(url) {
  const cachePath = getCachePath(url)
  try {
    if (fs.existsSync(cachePath)) {
      const stat = fs.statSync(cachePath)
      const age = Date.now() - stat.mtimeMs
      if (age < CACHE_TTL) {
        return { html: fs.readFileSync(cachePath, 'utf-8'), age }
      }
      // 过期，删除
      fs.unlinkSync(cachePath)
    }
  } catch {}
  return null
}

function writeCache(url, html) {
  try {
    fs.writeFileSync(getCachePath(url), html, 'utf-8')
  } catch (e) {
    console.warn('[Cache WRITE ERROR]', e.message)
  }
}

/* ============================================================
 * Puppeteer 浏览器管理
 * ============================================================ */

/** 匹配文章页 URL 的正则: /read/:id */
const ARTICLE_URL_RE = /\/read\/(\d+)\/?$/

/**
 * 从后端 API 获取文章数据（含正文 content）
 * @param {string} articleId
 * @returns {Promise<object|null>}
 */
async function fetchArticleFromBackend(articleId) {
  try {
    const res = await fetch(`${BACKEND_URL}/rest/article/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        where: { id: parseInt(articleId, 10) },
        take: 1,
        relations: ['category', 'tags', 'user'],
      }),
    })
    const json = await res.json()
    if (json.code === 0 && Array.isArray(json.data) && json.data.length > 0) {
      return json.data[0]
    }
  } catch (e) {
    console.warn('[API] Failed to fetch article', articleId, e.message)
  }
  return null
}

/**
 * 获取公开文章的最近链接索引。
 * 目的不是替代 sitemap，而是给“只抓首页入口”的爬虫一个更稳定的 URL 发现面。
 * 这里只取轻量字段，避免对 prerender 服务引入额外压力。
 *
 * @param {number} limit
 * @returns {Promise<Array<{ id: number|string, title: string, publishedAt?: string, updatedAt?: string }>>}
 */
async function fetchPublishedArticleLinks(limit = RECENT_DISCOVERY_LIMIT) {
  try {
    const res = await fetch(`${BACKEND_URL}/rest/article/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        where: { status: 'published', isPrivate: false },
        take: limit,
        order: { publishedAt: 'DESC', createdAt: 'DESC' },
        select: ['id', 'title', 'publishedAt', 'updatedAt'],
      }),
    })
    const json = await res.json()
    if (json.code === 0 && Array.isArray(json.data)) {
      return json.data.filter(item => item && item.id != null && item.title)
    }
  } catch (e) {
    console.warn('[API] Failed to fetch discovery links', e.message)
  }
  return []
}

/**
 * 将 Markdown 文本转换为基础 HTML（简易转换，确保搜索引擎能读取正文）
 * 不引入额外依赖，仅处理常见 Markdown 语法
 */
function markdownToSimpleHtml(md) {
  if (!md) return ''
  return md
    // 代码块 → <pre>
    .replace(/```[\s\S]*?```/g, (m) => {
      const content = m.replace(/```\w*\n?/, '').replace(/\n?```$/, '')
      return `<pre><code>${escapeHtmlText(content)}</code></pre>`
    })
    // 行内代码
    .replace(/`([^`]+)`/g, (_m, code) => `<code>${escapeHtmlText(code)}</code>`)
    // 标题 h1~h6
    .replace(/^#{6}\s+(.+)$/gm, '<h6>$1</h6>')
    .replace(/^#{5}\s+(.+)$/gm, '<h5>$1</h5>')
    .replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>')
    // 粗体 / 斜体
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // 无序列表
    .replace(/^[-*+]\s+(.+)$/gm, '<li>$1</li>')
    // 有序列表
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // 引用
    .replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
    // 链接
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, href) => `<a href="${escapeHtmlAttr(href)}">${escapeHtmlText(text)}</a>`)
    // 图片 → alt 文字（爬虫不需要图片）
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // 水平线
    .replace(/^[-*_]{3,}$/gm, '<hr>')
    // 段落
    .replace(/\n{2,}/g, '</p><p>')
    // 换行
    .replace(/\n/g, '<br>')
}

/**
 * 转义 HTML 文本节点，避免正文/标题中的特殊字符破坏结构。
 * 文本节点不需要转义引号，保留可读性。
 *
 * @param {unknown} value
 * @returns {string}
 */
function escapeHtmlText(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * 转义 HTML 属性值。
 * 百度/360 对 head 解析更保守，若标题或描述里的引号未转义，会直接得到损坏的 meta 标签。
 *
 * @param {unknown} value
 * @returns {string}
 */
function escapeHtmlAttr(value) {
  return escapeHtmlText(value)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 序列化 JSON-LD。
 * 这里额外转义 `<` / `>` / `&`，避免正文或标题里出现 `</script>` 等序列导致 script 提前闭合。
 *
 * @param {Record<string, unknown>} data
 * @returns {string}
 */
function serializeJsonLd(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/**
 * 判断当前路径是否需要补充“最近文章直链索引”。
 * 国内爬虫如果只把 `/` 当作入口页，需要从这里稳定发现更多 `/read/:id`。
 *
 * @param {string} urlPath
 * @returns {boolean}
 */
function shouldInjectDiscoveryLinks(urlPath) {
  return urlPath === '/' || urlPath === '/home' || urlPath === '/archive' || ARTICLE_URL_RE.test(urlPath)
}

/**
 * 在 prerender 输出里注入最近文章直链索引。
 * 该索引只复用已公开文章，不伪造额外内容；目标是把 URL 发现从“复杂首页 DOM”收敛成“稳定 anchor 列表”。
 *
 * @param {string} html
 * @param {Array<{ id: number|string, title: string, publishedAt?: string, updatedAt?: string }>} articles
 * @param {string} currentPath
 * @returns {string}
 */
function injectRecentArticleDiscoveryHtml(html, articles, currentPath) {
  if (!html || !Array.isArray(articles) || articles.length === 0) return html
  if (html.includes('id="prerender-article-discovery"')) return html

  const currentArticleId = currentPath.match(ARTICLE_URL_RE)?.[1] || null
  const items = articles
    .filter(article => String(article.id) !== String(currentArticleId || ''))
    .slice(0, RECENT_DISCOVERY_LIMIT)
    .map((article) => {
      const href = `${SITE_URL}/read/${article.id}`
      const datetime = article.updatedAt || article.publishedAt || ''
      const timeMarkup = datetime
        ? ` <time datetime="${escapeHtmlAttr(datetime)}">${escapeHtmlText(String(datetime).slice(0, 10))}</time>`
        : ''
      return `    <li><a href="${escapeHtmlAttr(href)}">${escapeHtmlText(article.title)}</a>${timeMarkup}</li>`
    })

  if (items.length === 0) return html

  const discoveryHtml = `
<nav id="prerender-article-discovery" aria-label="文章直链索引" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;">
  <h2>最近文章直链索引</h2>
  <ul>
${items.join('\n')}
  </ul>
</nav>`

  return html.replace('</body>', `${discoveryHtml}\n</body>`)
}

function detectBotName(ua = '') {
  const s = ua.toLowerCase()
  if (s.includes('baiduspider')) return 'Baiduspider'
  if (s.includes('googlebot')) return 'Googlebot'
  if (s.includes('bingbot') || s.includes('msnbot')) return 'Bingbot'
  if (s.includes('360spider') || s.includes('haosouspider') || s.includes('qihoobot')) return '360Spider'
  if (s.includes('sogou')) return 'Sogou'
  if (s.includes('yisouspider')) return 'YisouSpider'
  if (s.includes('bytespider') || s.includes('toutiaospider')) return 'Bytespider'
  if (s.includes('yandex')) return 'YandexBot'
  if (s.includes('duckduckbot')) return 'DuckDuckBot'
  if (s.includes('applebot')) return 'Applebot'
  if (s.includes('facebookexternalhit')) return 'FacebookBot'
  if (s.includes('twitterbot')) return 'Twitterbot'
  if (s.includes('linkedinbot')) return 'LinkedInBot'
  if (s.includes('telegrambot')) return 'TelegramBot'
  if (s.includes('whatsapp')) return 'WhatsAppBot'
  if (s.includes('petalbot')) return 'PetalBot'
  if (s.includes('semrushbot')) return 'SemrushBot'
  if (s.includes('ahrefsbot')) return 'AhrefsBot'
  if (s.includes('mj12bot')) return 'MJ12bot'
  return 'Crawler'
}

async function reportCrawlerVisit(payload) {
  try {
    const headers = { 'Content-Type': 'application/json' }
    if (CRAWLER_TRACK_KEY) headers['x-crawler-track-key'] = CRAWLER_TRACK_KEY
    await fetch(`${BACKEND_URL}/seo/crawler/track`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
  } catch (e) {
    console.warn('[Crawler TRACK ERROR]', e.message)
  }
}

/**
 * 对文章页面 HTML 注入正文内容 + 修正 SEO meta 标签
 * @param {string} html - Puppeteer 渲染的原始 HTML
 * @param {object} article - 后端返回的文章数据
 * @returns {string} 增强后的 HTML
 */
function enrichArticleHtml(html, article) {
  const siteName = 'U-Blog'
  const authorName = article.user?.namec || article.user?.username || ''
  const title = article.title || ''
  const description = article.desc || `${title} - ${authorName}`
  const keywords = [
    article.category?.name,
    ...(article.tags?.map(t => t.name) || []),
  ].filter(Boolean).join(',')
  const coverUrl = article.cover
    ? (article.cover.startsWith('http') ? article.cover : `${SITE_URL}${article.cover}`)
    : ''
  const publishedTime = article.publishedAt ? new Date(article.publishedAt).toISOString() : ''
  const modifiedTime = article.updatedAt ? new Date(article.updatedAt).toISOString() : ''
  const articleUrl = `${SITE_URL}/read/${article.id}`

  // 1. 替换 <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtmlText(title)} - ${escapeHtmlText(siteName)}</title>`)

  // 2. 替换/添加 meta 标签
  const metaReplacements = {
    description,
    keywords,
    author: authorName,
  }
  for (const [name, content] of Object.entries(metaReplacements)) {
    const metaRe = new RegExp(`<meta\\s+name="${name}"\\s+content="[^"]*"[^>]*>`, 'i')
    const newTag = `<meta name="${name}" content="${escapeHtmlAttr(content)}">`
    if (metaRe.test(html)) {
      html = html.replace(metaRe, newTag)
    } else {
      html = html.replace('</head>', `  ${newTag}\n</head>`)
    }
  }

  // 3. 添加/更新 Open Graph 标签
  const ogTags = {
    'og:title': title,
    'og:description': description,
    'og:type': 'article',
    'og:url': articleUrl,
    'og:site_name': siteName,
  }
  if (coverUrl) ogTags['og:image'] = coverUrl
  for (const [prop, content] of Object.entries(ogTags)) {
    const ogRe = new RegExp(`<meta\\s+property="${prop}"\\s+content="[^"]*"[^>]*>`, 'i')
    const newTag = `<meta property="${prop}" content="${escapeHtmlAttr(content)}">`
    if (ogRe.test(html)) {
      html = html.replace(ogRe, newTag)
    } else {
      html = html.replace('</head>', `  ${newTag}\n</head>`)
    }
  }

  // 4. 添加 article:published_time / modified_time
  if (publishedTime) {
    const tag = `<meta property="article:published_time" content="${publishedTime}">`
    if (!html.includes('article:published_time')) {
      html = html.replace('</head>', `  ${tag}\n</head>`)
    }
  }
  if (modifiedTime) {
    const tag = `<meta property="article:modified_time" content="${modifiedTime}">`
    if (!html.includes('article:modified_time')) {
      html = html.replace('</head>', `  ${tag}\n</head>`)
    }
  }

  // 5. 注入文章正文（作为 <article> 标签，对爬虫可见）
  if (article.content) {
    const articleHtml = markdownToSimpleHtml(article.content)
    const injectedContent = `
<article id="prerender-article-content" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;">
  <h1>${escapeHtmlText(title)}</h1>
  ${articleHtml}
</article>`
    // 注入到 </body> 之前
    html = html.replace('</body>', `${injectedContent}\n</body>`)
  }

  // 6. 注入 JSON-LD 结构化数据（如果缺少）
  if (!html.includes('application/ld+json') || !html.includes('"Article"')) {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      url: articleUrl,
      datePublished: publishedTime,
      dateModified: modifiedTime || publishedTime,
      author: { '@type': 'Person', name: authorName },
      publisher: { '@type': 'Organization', name: siteName },
      mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    }
    if (coverUrl) jsonLd.image = coverUrl
    if (article.viewCount) {
      jsonLd.interactionStatistic = {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ReadAction',
        userInteractionCount: article.viewCount,
      }
    }
    const ldTag = `<script type="application/ld+json">${serializeJsonLd(jsonLd)}</script>`
    html = html.replace('</head>', `  ${ldTag}\n</head>`)
  }

  return html
}

let browser = null
let activePages = 0

async function getBrowser() {
  if (browser && browser.connected) return browser

  console.log('[Browser] Launching Chromium...')
  browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--no-zygote',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-sync',
      '--disable-translate',
      '--disable-background-timer-throttling',
      '--no-first-run',
      '--metrics-recording-only',
    ],
  })

  browser.on('disconnected', () => {
    console.warn('[Browser] Disconnected, will relaunch on next request')
    browser = null
    activePages = 0
  })

  console.log('[Browser] Chromium launched, PID:', browser.process()?.pid)
  return browser
}

/**
 * 渲染指定 URL 并返回完整 HTML
 */
async function renderPage(url) {
  const b = await getBrowser()
  const page = await b.newPage()
  activePages++

  try {
    // 设置 viewport（影响响应式布局）
    await page.setViewport({ width: 1280, height: 800 })

    // 设置 User-Agent 避免被自身 JS 检测为爬虫
    await page.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 PrerenderBot/2.0'
    )

    // 拦截不需要的资源请求
    await page.setRequestInterception(true)
    page.on('request', (req) => {
      if (BLOCKED_RESOURCE_TYPES.has(req.resourceType())) {
        req.abort()
      } else {
        req.continue()
      }
    })

    // 导航到目标页面
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: PAGE_TIMEOUT,
    })

    // 额外等待，确保异步数据加载完成
    await new Promise(r => setTimeout(r, NETWORK_IDLE_WAIT))

    // 获取渲染后的 HTML
    let html = await page.content()

    // 移除非 JSON-LD 的 script 标签（减小体积）
    html = html.replace(
      /<script(?![^>]*type\s*=\s*["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>/gi,
      ''
    )

    // 文章页面增强：注入正文内容 + 修正 SEO meta 标签
    try {
      const urlPath = new URL(url).pathname
      const articleMatch = urlPath.match(ARTICLE_URL_RE)
      if (articleMatch) {
        const articleId = articleMatch[1]
        const article = await fetchArticleFromBackend(articleId)
        if (article) {
          html = enrichArticleHtml(html, article)
          console.log(`[ENRICH] Article #${articleId}: "${article.title}" (${(article.content?.length || 0)} chars)`)
        }
      }

      // URL 发现补强：即使爬虫当前只抓 `/` 或某一篇文章，也能拿到一组稳定的最近文章直链。
      if (shouldInjectDiscoveryLinks(urlPath)) {
        const recentArticles = await fetchPublishedArticleLinks()
        if (recentArticles.length > 0) {
          html = injectRecentArticleDiscoveryHtml(html, recentArticles, urlPath)
          console.log(`[DISCOVERY] ${urlPath} injected ${recentArticles.length} article links`)
        }
      }
    } catch (e) {
      console.warn('[ENRICH ERROR]', e.message)
    }

    return html
  } finally {
    activePages--
    await page.close().catch(() => {})
  }
}

/* ============================================================
 * Express 服务
 * ============================================================ */

const app = express()

/** 健康检查 */
app.get('/health', (req, res) => {
  const cacheFiles = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.html'))
  res.json({
    status: 'ok',
    activePages,
    cacheCount: cacheFiles.length,
    browserConnected: browser?.connected ?? false,
    uptime: Math.round(process.uptime()),
  })
})

/** 清除全部缓存 */
app.post('/cache/clear', (req, res) => {
  const files = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.html'))
  files.forEach(f => { try { fs.unlinkSync(path.join(CACHE_DIR, f)) } catch {} })
  console.log(`[Cache] Cleared ${files.length} files`)
  res.json({ cleared: files.length })
})

/** 清除指定 URL 缓存 */
app.post('/cache/purge', (req, res) => {
  const targetUrl = req.query.url
  if (!targetUrl) return res.status(400).json({ error: 'missing ?url= param' })

  const cachePath = getCachePath(targetUrl)
  if (fs.existsSync(cachePath)) {
    fs.unlinkSync(cachePath)
    console.log(`[Cache PURGE] ${targetUrl}`)
    res.json({ purged: true, url: targetUrl })
  } else {
    res.json({ purged: false, message: 'not cached' })
  }
})

/** 预渲染接口 — Nginx 将爬虫请求代理到这里 */
app.get('/render', async (req, res) => {
  const targetUrl = req.query.url
  if (!targetUrl) return res.status(400).send('Missing ?url= parameter')
  const userAgent = req.headers['user-agent'] || ''
  const botName = detectBotName(userAgent)
  const crawlerIp = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.ip || null

  // 黑名单检查
  try {
    const urlPath = new URL(targetUrl).pathname
    if (BLACKLIST.some(p => urlPath.startsWith(p))) {
      return res.status(204).send('')
    }
  } catch {
    return res.status(400).send('Invalid URL')
  }

  // 缓存检查
  const cached = readCache(targetUrl)
  if (cached) {
    console.log(`[HIT] ${targetUrl} (age: ${Math.round(cached.age / 1000)}s)`)
    reportCrawlerVisit({
      url: targetUrl,
      path: new URL(targetUrl).pathname,
      userAgent,
      botName,
      source: 'prerender',
      cacheHit: true,
      statusCode: 200,
      renderMs: 0,
      htmlBytes: cached.html.length,
      ip: Array.isArray(crawlerIp) ? String(crawlerIp[0]) : String(crawlerIp || ''),
    })
    res.set('X-Prerender-Cache', 'HIT')
    return res.send(cached.html)
  }

  // 并发控制
  if (activePages >= MAX_CONCURRENT) {
    console.warn(`[BUSY] ${targetUrl} — active: ${activePages}`)
    return res.status(503).set('Retry-After', '5').send('Prerender busy, retry later')
  }

  // 渲染
  const start = Date.now()
  try {
    console.log(`[RENDER] ${targetUrl}`)
    const html = await renderPage(targetUrl)
    const elapsed = Date.now() - start

    // 只缓存有实际内容的页面
    if (html && html.length > 500) {
      writeCache(targetUrl, html)
      console.log(`[DONE] ${targetUrl} — ${elapsed}ms, ${(html.length / 1024).toFixed(1)}KB`)
    } else {
      console.warn(`[EMPTY] ${targetUrl} — content too short (${html.length}b), skip cache`)
    }

    reportCrawlerVisit({
      url: targetUrl,
      path: new URL(targetUrl).pathname,
      userAgent,
      botName,
      source: 'prerender',
      cacheHit: false,
      statusCode: 200,
      renderMs: elapsed,
      htmlBytes: html?.length || 0,
      ip: Array.isArray(crawlerIp) ? String(crawlerIp[0]) : String(crawlerIp || ''),
    })

    res.set('X-Prerender-Cache', 'MISS')
    res.set('X-Prerender-Time', `${elapsed}ms`)
    res.send(html)
  } catch (err) {
    const elapsed = Date.now() - start
    console.error(`[ERROR] ${targetUrl} — ${elapsed}ms:`, err.message)
    res.status(500).send(`Render failed: ${err.message}`)
  }
})

/* ============================================================
 * 启动
 * ============================================================ */

app.listen(PORT, () => {
  console.log(`\n🚀 Prerender server running on port ${PORT}`)
  console.log(`   Cache: ${CACHE_DIR} (TTL: ${CACHE_TTL / 3600000}h)`)
  console.log(`   Max concurrent: ${MAX_CONCURRENT}`)
  console.log(`   Target site: ${SITE_URL}\n`)
})

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('[Shutdown] Closing browser...')
  if (browser) await browser.close().catch(() => {})
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('[Shutdown] Closing browser...')
  if (browser) await browser.close().catch(() => {})
  process.exit(0)
})
