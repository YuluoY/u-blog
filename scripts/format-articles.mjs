/**
 * 排版修复脚本
 * 对已迁移的文章内容统一排版：
 *   - 碎碎念类文章（纯文字段落）：首行缩进 `　　`（两个全角空格）
 *   - 清除原先不规范的 ASCII 空格缩进
 *   - 修复段落间多余空行
 *
 * 运行方式（在服务器上）：
 *   node /tmp/format-articles.mjs
 */

import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const PG_PATH = process.env.PG_PATH || '/var/www/u-blog/source/apps/backend/node_modules/pg'
let pg
try { pg = require(PG_PATH) } catch { pg = require('pg') }
const { Client } = pg

const DB_CONFIG = {
  host: '127.0.0.1',
  port: 5432,
  user: 'ublog',
  password: 'Ublog2024!',
  database: 'ublog',
}

/** 全角空格（首行缩进用） */
const INDENT = '　　'

/**
 * 对段落进行首行缩进处理
 * 规则：
 *  - 跳过代码块内容（以 ``` 包裹的区域）
 *  - 跳过已有缩进的行
 *  - 跳过标题行（# 开头）
 *  - 跳过列表行（- / * / 数字. 开头）
 *  - 跳过引用行（> 开头）
 *  - 跳过空行
 *  - 跳过 HTML 标签行
 *  - 对纯文字段落添加首行缩进
 */
function formatProse(content) {
  if (!content) return content

  const lines = content.split('\n')
  const result = []
  let inCodeBlock = false

  for (const line of lines) {
    // 代码块切换
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      result.push(line)
      continue
    }

    // 代码块内不处理
    if (inCodeBlock) {
      result.push(line)
      continue
    }

    const trimmed = line.trim()

    // 空行直接保留
    if (!trimmed) {
      result.push('')
      continue
    }

    // 跳过特殊标记行
    const isSpecial =
      trimmed.startsWith('#')          || // 标题
      trimmed.startsWith('>')          || // 引用
      trimmed.startsWith('-')          || // 无序列表
      trimmed.startsWith('*')          || // 列表或分隔线
      trimmed.startsWith('|')          || // 表格
      /^\d+\./.test(trimmed)           || // 有序列表
      trimmed.startsWith('<')          || // HTML
      trimmed.startsWith('!')          || // 图片
      trimmed.startsWith('[')          || // 链接或图片
      trimmed.startsWith('---')        || // 分隔线
      trimmed.startsWith('===')        || // 高亮块
      trimmed.startsWith(INDENT)          // 已有缩进

    if (isSpecial) {
      // 移除旧的 ASCII 空格缩进（不影响内容）
      result.push(trimmed)
      continue
    }

    // 纯文字段落 → 首行缩进
    result.push(INDENT + trimmed)
  }

  // 合并多余空行（超过 2 个合并为 1 个）
  return result
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function main() {
  console.log('🔌 连接数据库...')
  const client = new Client(DB_CONFIG)
  await client.connect()
  console.log('✅ 数据库连接成功\n')

  // 查询碎碎念分类（id=1）下的所有文章
  const { rows: articles } = await client.query(
    `SELECT id, title, content FROM article WHERE "categoryId" = 1 ORDER BY id`
  )

  console.log(`📝 需要修复排版的文章：${articles.length} 篇\n`)

  let updated = 0
  for (const article of articles) {
    const newContent = formatProse(article.content)

    // 内容有变化才更新
    if (newContent !== article.content) {
      await client.query(
        `UPDATE article SET content = $1, "updatedAt" = NOW() WHERE id = $2`,
        [newContent, article.id]
      )
      console.log(`  ✅ [id=${article.id}] ${article.title}`)
      updated++
    } else {
      console.log(`  ⏭️  [id=${article.id}] ${article.title}（无需修改）`)
    }
  }

  await client.end()

  console.log('\n' + '─'.repeat(45))
  console.log(`✅ 排版修复完成，更新 ${updated}/${articles.length} 篇`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
