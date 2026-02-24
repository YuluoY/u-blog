/**
 * 笔记直连 PostgreSQL 迁移脚本（服务器端执行）
 * 运行方式：node /tmp/migrate-notes-db.mjs
 */

import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'

// 使用 backend 目录下的 pg 模块
const require = createRequire(import.meta.url)
const { Client } = require('/var/www/u-blog/source/apps/backend/node_modules/pg')

const NOTES_DIR = process.env.NOTES_DIR || '/tmp/notes'
const OWNER_ID = 1  // huyongle 的真实 user id

// ─── PostgreSQL 客户端 ────────────────────────────────────────────────────────
const client = new Client({
  host: '127.0.0.1',
  port: 5432,
  user: 'ublog',
  password: 'Ublog2024!',
  database: 'ublog',
})

// ─── 内容清理 ─────────────────────────────────────────────────────────────────
function cleanContent(text) {
  return text
    .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, '$2')   // Obsidian wiki 链接
    .replace(/!\[([^\]]*)\]\([^)]+\.(?:jpg|jpeg|png|gif|webp)[^)]*\)/gi,
      (_, alt) => alt ? `> 图：${alt}` : '')            // 移除本地图片引用
    .replace(/^　+/gm, '')                               // 全角缩进
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function readFile(rel) {
  const p = path.join(NOTES_DIR, rel)
  if (!fs.existsSync(p)) { console.warn(`⚠️  文件不存在: ${p}`); return null }
  return cleanContent(fs.readFileSync(p, 'utf-8'))
}

// ─── 解析 2024年的我.md 各日期章节 ────────────────────────────────────────────
function parse2024Journals() {
  const raw = fs.readFileSync(path.join(NOTES_DIR, '碎碎念/2024/2024年的我.md'), 'utf-8')
  const sectionRegex = /^#{1,2} (?:\[\[.*?\|)?(\d{2}-\d{2})\]?\]?/gm
  const matches = [...raw.matchAll(sectionRegex)]

  const titleMap = {
    '09-21': '书海漫游 · 路遥《平凡的世界》与《人生》读后感',
    '09-22': '书海漫游 · 余华《活着》读后感',
    '09-23': '工作日常 · 动态结构组件有趣的一天',
    '10-01': '表哥的婚礼 · 国庆记事',
    '10-19': '乒乓球比赛 · 秋日漫想',
    '10-27': '一个人去长沙',
    '11-02': '与老友相聚的周末 · LOL总决赛',
    '11-18': '重庆婚宴之行',
    '11-24': '初次滑雪体验记',
  }

  const sections = []
  for (let i = 0; i < matches.length; i++) {
    const date = matches[i][1]
    const start = matches[i].index + matches[i][0].length
    const end = i + 1 < matches.length ? matches[i + 1].index : raw.length
    const content = raw.slice(start, end).trim()
    if (!content || content.length < 20) continue

    const isTravel = ['10-27', '11-18'].includes(date)

    sections.push({
      title: titleMap[date] || `2024年${date} · 随笔`,
      content: cleanContent(`> 写于 2024年${date}\n\n${content}`),
      category: '碎碎念',
      tags: isTravel ? ['随笔', '旅行'] : ['随笔'],
      publishedAt: `2024-${date} 00:00:00`,
    })
  }
  return sections
}

// ─── 文章清单 ─────────────────────────────────────────────────────────────────
function buildArticles() {
  const list = []

  // 碎碎念 / 2024年按章节拆分
  list.push(...parse2024Journals())

  // 碎碎念 / 2025年的我（单章节）
  const c25 = readFile('碎碎念/2025/2025年的我.md')
  if (c25) list.push({
    title: '2025年8月 · 迷茫与焦虑中思考',
    content: c25, category: '碎碎念',
    tags: ['随笔', '求职'], publishedAt: '2025-08-29 00:00:00',
  })

  // 碎碎念 / 面试经历
  const interview = readFile('碎碎念/2025/面试经历.md')
  if (interview) list.push({
    title: '2025年求职面试复盘',
    content: interview, category: '碎碎念',
    tags: ['随笔', '求职', '面试'], publishedAt: '2025-09-01 00:00:00',
  })

  // 无题小记
  const wuti = readFile('无题小记20260208.md')
  if (wuti) list.push({
    title: '无题小记',
    content: wuti, category: '碎碎念',
    tags: ['随笔'], publishedAt: '2026-02-08 00:00:00',
  })

  // 生活 / 武汉租房日记
  const wuhan = readFile('Life/1-武汉租房日记.md')
  if (wuhan) list.push({
    title: '武汉租房日记',
    content: wuhan, category: '碎碎念',
    tags: ['随笔', '生活'], publishedAt: '2024-03-12 00:00:00',
  })

  // 技术博客
  const blog1 = readFile('Blog/1-Sass之BEM前端规范架构/Sass之BEM前端规范架构.md')
  if (blog1) list.push({
    title: 'Sass 之 BEM 前端规范架构',
    content: blog1, category: '技术',
    tags: ['CSS', 'Sass', '前端工程化'], publishedAt: '2023-06-01 00:00:00',
  })

  const blog2 = readFile('Blog/2-NestJS文件上传之本地、腾讯Cos上传/NestJS文件上传之本地、腾讯Cos上传.md')
  if (blog2) list.push({
    title: 'NestJS 文件上传之本地与腾讯 COS',
    content: blog2, category: '技术',
    tags: ['NestJS', 'Node.js', '后端'], publishedAt: '2023-07-01 00:00:00',
  })

  const blog3 = readFile('Blog/3-Vite + Vue3 + TS前端企业级项目搭建/Vite + Vue3 + TS前端企业级项目搭建.md')
  if (blog3) list.push({
    title: 'Vite + Vue3 + TypeScript 前端企业级项目搭建',
    content: blog3, category: '技术',
    tags: ['Vue3', 'Vite', 'TypeScript', '前端工程化'], publishedAt: '2023-08-01 00:00:00',
  })

  const blog4 = readFile('Blog/4-项目开发模板搭建/Vue模板.md')
  if (blog4) list.push({
    title: 'Vue 项目开发模板搭建',
    content: blog4, category: '技术',
    tags: ['Vue3', '前端工程化'], publishedAt: '2023-09-01 00:00:00',
  })

  // 练习
  const ex1 = readFile('Exercise/1-瀑布流布局实现/Vue3瀑布流布局实现.md')
  if (ex1) list.push({
    title: 'Vue3 瀑布流布局实现',
    content: ex1, category: '技术',
    tags: ['Vue3', 'CSS'], publishedAt: '2023-10-01 00:00:00',
  })

  // 学习笔记
  const react = readFile('Study/1-React/React.md')
  if (react) list.push({
    title: 'React 学习笔记',
    content: react, category: '技术',
    tags: ['React', '前端'], publishedAt: '2023-04-01 00:00:00',
  })

  const nginx = readFile('Study/2-Nginx/Nginx.md')
  if (nginx) list.push({
    title: 'Nginx 学习笔记',
    content: nginx, category: '技术',
    tags: ['Nginx', '运维'], publishedAt: '2023-04-15 00:00:00',
  })

  const sql = readFile('Study/3-SQL/SQL.md')
  if (sql) list.push({
    title: 'SQL 学习笔记',
    content: sql, category: '技术',
    tags: ['SQL', '数据库'], publishedAt: '2023-05-01 00:00:00',
  })

  const vscBase = readFile('Study/4-VsCode/Base.md')
  if (vscBase) list.push({
    title: 'VS Code 基础使用指南',
    content: vscBase, category: '技术',
    tags: ['VsCode', '工具'], publishedAt: '2023-05-15 00:00:00',
  })

  const vscComp = readFile('Study/4-VsCode/Completion.md')
  if (vscComp) list.push({
    title: 'VS Code 代码补全配置',
    content: vscComp, category: '技术',
    tags: ['VsCode', '工具'], publishedAt: '2023-05-20 00:00:00',
  })

  // 项目
  const proj1 = readFile('Project/1-Vue3 音乐播放器/Vue3音乐播放器.md')
  if (proj1) list.push({
    title: 'Vue3 音乐播放器',
    content: proj1, category: '项目',
    tags: ['Vue3', '项目'], publishedAt: '2023-11-01 00:00:00',
  })

  const proj2 = readFile('Project/2-React18 仿网易云音乐官网/README.md')
  if (proj2) list.push({
    title: 'React18 仿网易云音乐官网',
    content: proj2, category: '项目',
    tags: ['React', '项目'], publishedAt: '2023-12-01 00:00:00',
  })

  // 微内核架构文档
  const kernel = readFile('未命名.md')
  if (kernel) list.push({
    title: '微内核架构使用指南',
    content: kernel, category: '技术',
    tags: ['架构', '低代码', 'JavaScript'], publishedAt: '2025-06-01 00:00:00',
  })

  return list
}

// ─── 标签颜色 ─────────────────────────────────────────────────────────────────
const TAG_COLORS = {
  随笔: '#8B5CF6', 生活: '#10B981', 旅行: '#3B82F6', 求职: '#EF4444',
  面试: '#EC4899', CSS: '#06B6D4', Sass: '#CF649A', 前端工程化: '#4F46E5',
  NestJS: '#E0234E', 'Node.js': '#68A063', Vue3: '#41B883', Vite: '#646CFF',
  TypeScript: '#3178C6', React: '#61DAFB', Nginx: '#009900', 运维: '#78716C',
  SQL: '#336791', 数据库: '#FF6600', VsCode: '#0078D4', 工具: '#52525B',
  架构: '#7C3AED', 低代码: '#DB2777', JavaScript: '#F0DB4F', 项目: '#14B8A6',
  前端: '#0EA5E9', 后端: '#059669',
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔌 连接数据库...')
  await client.connect()
  console.log('✅ 数据库连接成功\n')

  try {
    await client.query('BEGIN')

    // ── 1. 清理虚假初始化数据 ──────────────────────────────────────────────
    console.log('🗑️  清理虚假初始化数据...')

    // 清除所有文章相关联表（外键依赖顺序）
    const { rowCount: atDel } = await client.query('DELETE FROM article_tag')
    const { rowCount: cmtDel } = await client.query('DELETE FROM comment')
    const { rowCount: likeDel } = await client.query('DELETE FROM "like"')
    const { rowCount: viewDel } = await client.query('DELETE FROM "view"')
    const { rowCount: artDel } = await client.query('DELETE FROM article')
    await client.query("SELECT setval(pg_get_serial_sequence('article','id'), 1, false)")
    console.log(`  已删除 ${artDel} 篇假文章，${atDel} 条标签关联，${cmtDel} 条评论，${likeDel} 条点赞，${viewDel} 条浏览记录`)

    // 清除假分类（保留 id 序列从1重新开始）
    const { rowCount: catDel } = await client.query('DELETE FROM category')
    await client.query("SELECT setval(pg_get_serial_sequence('category','id'), 1, false)")
    console.log(`  已删除 ${catDel} 个假分类`)

    // 清除假标签（保留已有真实标签不重复）
    const { rowCount: tagDel } = await client.query('DELETE FROM tag')
    await client.query("SELECT setval(pg_get_serial_sequence('tag','id'), 1, false)")
    console.log(`  已删除 ${tagDel} 个假标签\n`)

    // ── 2. 创建分类 ────────────────────────────────────────────────────────
    console.log('📁 创建分类...')
    const categoryNames = ['碎碎念', '技术', '项目']
    const categoryMap = {}
    for (const name of categoryNames) {
      const res = await client.query(
        `INSERT INTO category (name, "userId", "createdAt", "updatedAt")
         VALUES ($1, $2, NOW(), NOW())
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [name, OWNER_ID]
      )
      if (res.rows.length > 0) {
        categoryMap[name] = res.rows[0].id
        console.log(`  ✅ 分类「${name}」id=${res.rows[0].id}`)
      } else {
        const ex = await client.query('SELECT id FROM category WHERE name=$1', [name])
        categoryMap[name] = ex.rows[0].id
        console.log(`  ℹ️  分类「${name}」已存在 id=${ex.rows[0].id}`)
      }
    }
    console.log('')

    // ── 3. 创建标签 ────────────────────────────────────────────────────────
    console.log('🏷️  创建标签...')
    const articles = buildArticles()
    const tagNames = [...new Set(articles.flatMap(a => a.tags))]
    const tagMap = {}
    for (const name of tagNames) {
      const color = TAG_COLORS[name] || '#6B7280'
      const res = await client.query(
        `INSERT INTO tag (name, color, "userId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [name, color, OWNER_ID]
      )
      if (res.rows.length > 0) {
        tagMap[name] = res.rows[0].id
        console.log(`  ✅ 标签「${name}」id=${res.rows[0].id}`)
      } else {
        const ex = await client.query('SELECT id FROM tag WHERE name=$1', [name])
        tagMap[name] = ex.rows[0].id
        console.log(`  ℹ️  标签「${name}」已存在 id=${ex.rows[0].id}`)
      }
    }
    console.log('')

    // ── 4. 插入文章 ────────────────────────────────────────────────────────
    console.log('📝 插入文章...')
    let ok = 0, fail = 0

    for (const article of articles) {
      const categoryId = categoryMap[article.category] ?? null
      const tagIds = article.tags.map(t => tagMap[t]).filter(Boolean)

      // 取前120字作 desc
      const desc = article.content
        .split('\n')
        .filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('>') && l.length > 10)
        .join('').replace(/[#*`]/g, '').trim().slice(0, 120) || null

      try {
        const res = await client.query(
          `INSERT INTO article
             (title, content, "desc", status, "isPrivate", "isTop",
              "userId", "categoryId", "commentCount", "likeCount",
              "viewCount", "publishedAt", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,'published',false,false,$4,$5,0,0,0,$6,NOW(),NOW())
           RETURNING id`,
          [article.title, article.content, desc, OWNER_ID, categoryId, article.publishedAt]
        )
        const articleId = res.rows[0].id

        // 关联标签
        for (const tagId of tagIds) {
          await client.query(
            `INSERT INTO article_tag ("articleId","tagId") VALUES ($1,$2) ON CONFLICT DO NOTHING`,
            [articleId, tagId]
          )
        }

        console.log(`  ✅ [${article.category}] ${article.title} (id=${articleId}, tags=${tagIds.join(',')})`)
        ok++
      } catch (err) {
        console.error(`  ❌ [${article.category}] ${article.title} → ${err.message}`)
        fail++
      }
    }

    await client.query('COMMIT')
    console.log('\n─────────────────────────────────────')
    console.log(`✅ 成功: ${ok} 篇`)
    if (fail > 0) console.log(`❌ 失败: ${fail} 篇`)
    console.log('🎉 迁移完成！')

  } catch (err) {
    await client.query('ROLLBACK')
    console.error('💥 事务回滚:', err.message)
    throw err
  } finally {
    await client.end()
  }
}

main().catch(err => { console.error(err); process.exit(1) })
