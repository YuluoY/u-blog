/**
 * 笔记迁移脚本
 * 将 /Users/huyongle/Desktop/Projects/notes 中的文档迁移到线上数据库
 *
 * 规则：
 * - 过滤 Kanban、Timeline 等无用文档
 * - 2024年的我.md 按日期章节拆分
 * - 根据内容自动分类和打标签
 * - 不润色、不改动内容，只做排版清理
 */

import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'

// ─── 配置 ──────────────────────────────────────────────────────────────────
const NOTES_DIR = process.env.NOTES_DIR || '/Users/huyongle/Desktop/Projects/notes'
const API_BASE = 'http://localhost:3000'
const CREDENTIALS = { username: 'huyongle', password: '123456' }
const USER_ID = 3

// ─── HTTP 请求工具 ────────────────────────────────────────────────────────────
function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const isHttps = parsed.protocol === 'https:'
    const client = isHttps ? https : http

    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }

    const req = client.request(reqOptions, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) })
        } catch {
          resolve({ status: res.statusCode, body: data })
        }
      })
    })

    req.on('error', reject)

    if (body) {
      req.write(JSON.stringify(body))
    }
    req.end()
  })
}

// ─── 内容清理工具 ─────────────────────────────────────────────────────────────

/**
 * 清理 Obsidian wiki 链接语法 [[path|text]] → text
 * 清理全角缩进空格（中文段落排版用的　）
 * 不改动实际内容文字
 */
function cleanContent(text) {
  return text
    // 移除 Obsidian wiki 链接 [[path#anchor|text]] → text
    .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, '$2')
    // 移除图片引用中的本地路径（保留 alt 文字）
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, (_, alt) => alt ? `> 图片：${alt}` : '')
    // 全角空格段落缩进 → 普通空行分段
    .replace(/^　+/gm, '')
    // 多余空行收缩为最多2行
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * 从2024年的我.md解析出各个日期章节
 * 返回: [{date, title, content}]
 */
function parse2024Journal(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8')

  // 用 ## 或 # 作为分割点（文件里11-24用的 # 而不是 ##）
  const sectionRegex = /^#{1,2} (?:\[\[.*?\|)?(\d{2}-\d{2})\]?\]?/gm
  const matches = [...raw.matchAll(sectionRegex)]

  const sections = []
  for (let i = 0; i < matches.length; i++) {
    const date = matches[i][1]
    const start = matches[i].index + matches[i][0].length
    const end = i + 1 < matches.length ? matches[i + 1].index : raw.length
    const content = raw.slice(start, end).trim()

    // 跳过内容为空的章节
    if (!content || content.length < 20) continue

    sections.push({ date, content: cleanContent(content) })
  }
  return sections
}

/**
 * 根据日期和内容关键词给碎碎念章节生成标题
 */
function inferJournalTitle(date, content) {
  const titleMap = {
    '09-21': '书海漫游 · 路遥《平凡的世界》与《人生》读后感',
    '09-22': '书海漫游 · 余华《活着》读后感',
    '09-23': '工作日常杂想 · 动态结构组件',
    '10-01': '参加表哥婚礼 · 国庆记事',
    '10-19': '乒乓球比赛 · 秋日漫想',
    '10-27': '一个人去长沙',
    '11-02': '与老友相聚的周末 · LOL总决赛',
    '11-18': '重庆婚宴之行',
    '11-24': '初次滑雪体验记',
  }
  return titleMap[date] || `2024年${date} · 随笔`
}

// ─── 文章清单定义 ──────────────────────────────────────────────────────────────

function loadFile(relativePath) {
  return cleanContent(fs.readFileSync(path.join(NOTES_DIR, relativePath), 'utf-8'))
}

function buildArticleList() {
  const articles = []

  // ── 碎碎念 / 2024年的我 → 按日期拆分 ──────────────────────────────
  const journalSections = parse2024Journal(
    path.join(NOTES_DIR, '碎碎念/2024/2024年的我.md')
  )
  for (const { date, content } of journalSections) {
    articles.push({
      title: inferJournalTitle(date, content),
      content: `> 写于 2024年${date}\n\n${content}`,
      category: '碎碎念',
      tags: ['随笔', date.startsWith('10-27') || date === '11-18' ? '旅行' : '生活'],
      publishedAt: `2024-${date}T00:00:00.000Z`,
    })
  }

  // ── 碎碎念 / 2025年的我 (仅一个章节) ─────────────────────────────
  articles.push({
    title: '2025年8月 · 迷茫与焦虑中思考',
    content: loadFile('碎碎念/2025/2025年的我.md'),
    category: '碎碎念',
    tags: ['随笔', '求职'],
    publishedAt: '2025-08-29T00:00:00.000Z',
  })

  // ── 碎碎念 / 面试经历 ─────────────────────────────────────────────
  articles.push({
    title: '2025年求职面试复盘',
    content: loadFile('碎碎念/2025/面试经历.md'),
    category: '碎碎念',
    tags: ['随笔', '求职', '面试'],
    publishedAt: '2025-08-01T00:00:00.000Z',
  })

  // ── 无题小记 ──────────────────────────────────────────────────────
  articles.push({
    title: '无题小记',
    content: loadFile('无题小记20260208.md'),
    category: '碎碎念',
    tags: ['随笔'],
    publishedAt: '2026-02-08T00:00:00.000Z',
  })

  // ── 生活 / 武汉租房日记 ────────────────────────────────────────────
  articles.push({
    title: '武汉租房日记',
    content: loadFile('Life/1-武汉租房日记.md'),
    category: '碎碎念',
    tags: ['日记', '生活'],
    publishedAt: '2024-03-12T00:00:00.000Z',
  })

  // ── 技术博客 ──────────────────────────────────────────────────────
  articles.push({
    title: 'Sass 之 BEM 前端规范架构',
    content: loadFile('Blog/1-Sass之BEM前端规范架构/Sass之BEM前端规范架构.md'),
    category: '技术',
    tags: ['CSS', 'Sass', '前端工程化'],
    publishedAt: '2023-06-01T00:00:00.000Z',
  })

  articles.push({
    title: 'NestJS 文件上传之本地与腾讯 COS',
    content: loadFile('Blog/2-NestJS文件上传之本地、腾讯Cos上传/NestJS文件上传之本地、腾讯Cos上传.md'),
    category: '技术',
    tags: ['NestJS', 'Node.js', '后端'],
    publishedAt: '2023-07-01T00:00:00.000Z',
  })

  articles.push({
    title: 'Vite + Vue3 + TypeScript 前端企业级项目搭建',
    content: loadFile('Blog/3-Vite + Vue3 + TS前端企业级项目搭建/Vite + Vue3 + TS前端企业级项目搭建.md'),
    category: '技术',
    tags: ['Vue3', 'Vite', 'TypeScript', '前端工程化'],
    publishedAt: '2023-08-01T00:00:00.000Z',
  })

  articles.push({
    title: 'Vue 项目开发模板搭建',
    content: loadFile('Blog/4-项目开发模板搭建/Vue模板.md'),
    category: '技术',
    tags: ['Vue3', '前端工程化'],
    publishedAt: '2023-09-01T00:00:00.000Z',
  })

  // ── 技术练习 ──────────────────────────────────────────────────────
  articles.push({
    title: 'Vue3 瀑布流布局实现',
    content: loadFile('Exercise/1-瀑布流布局实现/Vue3瀑布流布局实现.md'),
    category: '技术',
    tags: ['Vue3', 'CSS'],
    publishedAt: '2023-10-01T00:00:00.000Z',
  })

  // ── 学习笔记 ──────────────────────────────────────────────────────
  articles.push({
    title: 'React 学习笔记',
    content: loadFile('Study/1-React/React.md'),
    category: '技术',
    tags: ['React', '前端'],
    publishedAt: '2023-04-01T00:00:00.000Z',
  })

  articles.push({
    title: 'Nginx 学习笔记',
    content: loadFile('Study/2-Nginx/Nginx.md'),
    category: '技术',
    tags: ['Nginx', '后端', '运维'],
    publishedAt: '2023-04-15T00:00:00.000Z',
  })

  articles.push({
    title: 'SQL 学习笔记',
    content: loadFile('Study/3-SQL/SQL.md'),
    category: '技术',
    tags: ['SQL', '数据库'],
    publishedAt: '2023-05-01T00:00:00.000Z',
  })

  articles.push({
    title: 'VS Code 基础使用指南',
    content: loadFile('Study/4-VsCode/Base.md'),
    category: '技术',
    tags: ['VsCode', '工具'],
    publishedAt: '2023-05-15T00:00:00.000Z',
  })

  articles.push({
    title: 'VS Code 代码补全配置',
    content: loadFile('Study/4-VsCode/Completion.md'),
    category: '技术',
    tags: ['VsCode', '工具'],
    publishedAt: '2023-05-20T00:00:00.000Z',
  })

  // ── 项目 ──────────────────────────────────────────────────────────
  articles.push({
    title: 'Vue3 音乐播放器',
    content: loadFile('Project/1-Vue3 音乐播放器/Vue3音乐播放器.md'),
    category: '项目',
    tags: ['Vue3', '项目'],
    publishedAt: '2023-11-01T00:00:00.000Z',
  })

  articles.push({
    title: 'React18 仿网易云音乐官网',
    content: loadFile('Project/2-React18 仿网易云音乐官网/README.md'),
    category: '项目',
    tags: ['React', '项目'],
    publishedAt: '2023-12-01T00:00:00.000Z',
  })

  // ── 技术文档 ──────────────────────────────────────────────────────
  articles.push({
    title: '微内核架构使用指南',
    content: loadFile('未命名.md'),
    category: '技术',
    tags: ['架构', '低代码', 'JavaScript'],
    publishedAt: '2025-06-01T00:00:00.000Z',
  })

  return articles
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('📦 开始笔记迁移...\n')

  // 1. 登录获取 token
  console.log('🔐 登录中...')
  const loginRes = await request(`${API_BASE}/login`, { method: 'POST' }, CREDENTIALS)
  if (loginRes.body?.code !== 0) {
    console.error('❌ 登录失败:', JSON.stringify(loginRes.body))
    process.exit(1)
  }
  const token = loginRes.body.data?.accessToken
  console.log('✅ 登录成功\n')

  const authHeaders = { Authorization: `Bearer ${token}` }

  // 2. 构建文章清单
  console.log('📂 读取文件内容...')
  const articles = buildArticleList()
  console.log(`✅ 共 ${articles.length} 篇文章待迁移\n`)

  // 3. 收集所有分类和标签
  const categoryNames = [...new Set(articles.map((a) => a.category))]
  const tagNames = [...new Set(articles.flatMap((a) => a.tags))]

  // 4. 创建分类
  console.log('📁 创建分类...')
  const categoryMap = {} // name → id
  for (const name of categoryNames) {
    const res = await request(
      `${API_BASE}/rest/category/add`,
      { method: 'POST', headers: authHeaders },
      { name, userId: USER_ID }
    )
    if (res.body?.code === 0) {
      categoryMap[name] = res.body.data?.id
      console.log(`  ✅ 分类「${name}」创建成功 (id=${res.body.data?.id})`)
    } else {
      // 可能已存在，查询获取 id
      const queryRes = await request(
        `${API_BASE}/rest/category/query`,
        { method: 'POST', headers: authHeaders },
        { where: { name }, take: 1 }
      )
      const existing = queryRes.body?.data?.list?.[0] || queryRes.body?.data?.[0]
      if (existing) {
        categoryMap[name] = existing.id
        console.log(`  ℹ️  分类「${name}」已存在 (id=${existing.id})`)
      } else {
        console.error(`  ❌ 分类「${name}」创建失败:`, JSON.stringify(res.body))
      }
    }
  }
  console.log('')

  // 5. 创建标签
  console.log('🏷️  创建标签...')
  const tagColorMap = {
    随笔: '#8B5CF6', 生活: '#10B981', 旅行: '#3B82F6', 日记: '#F59E0B',
    求职: '#EF4444', 面试: '#EC4899', 读书感悟: '#6366F1',
    CSS: '#06B6D4', Sass: '#CF649A', 前端工程化: '#4F46E5',
    NestJS: '#E0234E', 'Node.js': '#68A063', 后端: '#059669',
    Vue3: '#41B883', Vite: '#646CFF', TypeScript: '#3178C6',
    React: '#61DAFB', Nginx: '#009900', SQL: '#336791', 数据库: '#FF6600',
    VsCode: '#0078D4', 工具: '#52525B', 运维: '#78716C',
    架构: '#7C3AED', 低代码: '#DB2777', JavaScript: '#F7DF1E',
    项目: '#14B8A6', 前端: '#0EA5E9',
  }
  const tagMap = {} // name → id
  for (const name of tagNames) {
    const res = await request(
      `${API_BASE}/rest/tag/add`,
      { method: 'POST', headers: authHeaders },
      { name, userId: USER_ID, color: tagColorMap[name] || '#6B7280' }
    )
    if (res.body?.code === 0) {
      tagMap[name] = res.body.data?.id
      console.log(`  ✅ 标签「${name}」创建成功 (id=${res.body.data?.id})`)
    } else {
      // 可能已存在
      const queryRes = await request(
        `${API_BASE}/rest/tag/query`,
        { method: 'POST', headers: authHeaders },
        { where: { name }, take: 1 }
      )
      const existing = queryRes.body?.data?.list?.[0] || queryRes.body?.data?.[0]
      if (existing) {
        tagMap[name] = existing.id
        console.log(`  ℹ️  标签「${name}」已存在 (id=${existing.id})`)
      } else {
        console.error(`  ❌ 标签「${name}」创建失败:`, JSON.stringify(res.body))
      }
    }
  }
  console.log('')

  // 6. 创建文章
  console.log('📝 创建文章...')
  let successCount = 0
  let failCount = 0

  for (const article of articles) {
    const tagIds = article.tags
      .map((t) => tagMap[t])
      .filter(Boolean)
      .map(Number)

    const categoryId = categoryMap[article.category] ?? null

    // 从内容第一段生成 desc（最多120字）
    const firstParagraph = article.content
      .replace(/^#+.+$/m, '')
      .replace(/^>.+$/m, '')
      .trim()
      .split('\n')
      .find((l) => l.trim().length > 10) || ''
    const desc = firstParagraph.replace(/[#*`>]/g, '').trim().slice(0, 120)

    const payload = {
      title: article.title,
      content: article.content,
      desc: desc || null,
      status: 'published',
      isPrivate: false,
      isTop: false,
      userId: USER_ID,
      categoryId,
      tags: tagIds,
      publishedAt: article.publishedAt,
    }

    try {
      const res = await request(
        `${API_BASE}/rest/article/add`,
        { method: 'POST', headers: authHeaders },
        payload
      )
      if (res.body?.code === 0) {
        console.log(`  ✅ [${article.category}] ${article.title}`)
        successCount++
      } else {
        console.error(`  ❌ [${article.category}] ${article.title} → ${JSON.stringify(res.body?.message || res.body)}`)
        failCount++
      }
    } catch (err) {
      console.error(`  💥 [${article.category}] ${article.title} → ${err.message}`)
      failCount++
    }

    // 避免请求过快
    await new Promise((r) => setTimeout(r, 300))
  }

  console.log('\n─────────────────────────────────────')
  console.log(`✅ 成功: ${successCount} 篇`)
  if (failCount > 0) console.log(`❌ 失败: ${failCount} 篇`)
  console.log('🎉 迁移完成！')
}

main().catch((err) => {
  console.error('💥 脚本异常:', err)
  process.exit(1)
})
