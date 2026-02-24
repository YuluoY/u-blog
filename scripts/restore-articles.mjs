/**
 * 恢复被 fix-articles-v2.mjs 损坏的文章
 * 从 /tmp/notes 重新读取原始 markdown 文件并更新数据库
 * 运行方式：在服务器执行 node /tmp/restore-articles.mjs
 */

import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'

const require = createRequire(import.meta.url)
const { Client } = require('/var/www/u-blog/source/apps/backend/node_modules/pg')

const NOTES_DIR = '/tmp/notes'

// 与 migrate-notes-db.mjs 相同的清理逻辑
function cleanContent(text) {
  return text
    .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, '$2')   // Obsidian wiki 链接
    .replace(/!\[([^\]]*)\]\([^)]+\.(?:jpg|jpeg|png|gif|webp)[^)]*\)/gi,
      (_, alt) => alt ? `> 图：${alt}` : '')            // 移除本地图片引用
    .replace(/^　+/gm, '')                               // 全角缩进
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// 需要恢复的文章映射：DB id → 源文件路径
const RESTORE_MAP = [
  { id: 17, file: 'Blog/4-项目开发模板搭建/Vue模板.md',           title: 'Vue 项目开发模板搭建' },
  { id: 19, file: 'Study/1-React/React.md',                       title: 'React 学习笔记' },
  { id: 24, file: 'Project/2-React18 仿网易云音乐官网/README.md', title: 'React18 仿网易云音乐官网' },
]

async function main() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'ublog',
    password: 'Ublog2024!',
    database: 'ublog',
  })

  console.log('🔌 连接数据库...')
  await client.connect()

  for (const { id, file, title } of RESTORE_MAP) {
    const filePath = path.join(NOTES_DIR, file)
    if (!fs.existsSync(filePath)) {
      console.log(`❌ 文件不存在: ${filePath}`)
      continue
    }

    const raw = fs.readFileSync(filePath, 'utf-8')
    const content = cleanContent(raw)

    // 查询当前长度
    const before = await client.query('SELECT length(content) as len FROM article WHERE id = $1', [id])
    const beforeLen = before.rows[0]?.len || 0

    // 更新文章内容
    await client.query(
      'UPDATE article SET content = $1, "updatedAt" = NOW() WHERE id = $2',
      [content, id]
    )

    console.log(`✅ [${id}] ${title}: ${beforeLen} → ${content.length} chars`)
  }

  await client.end()
  console.log('\n🎉 恢复完成！')
}

main().catch(err => {
  console.error('💥 恢复失败:', err)
  process.exit(1)
})
