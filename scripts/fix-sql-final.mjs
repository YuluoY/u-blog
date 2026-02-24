/**
 * 修复 SQL 系列文章：
 * 1. 移除开头 "上一章练习(题)答案" 段落
 * 2. 移除开头私有区域 Unicode 字符 (U+F680 等)
 */
import { Pool } from 'pg'
const pool = new Pool({host:'127.0.0.1',port:5432,user:'ublog',password:'Ublog2024!',database:'ublog'})

const client = await pool.connect()

// 所有需检查的 CSDN 文章
const { rows } = await client.query('SELECT id, title, content FROM article WHERE id >= 37 ORDER BY id')

let fixCount = 0
for (const { id, title, content } of rows) {
  let c = content
  const orig = c

  // 1. 移除私有区域 Unicode (U+E000-U+F8FF) 和其他零宽字符
  c = c.replace(/[\uE000-\uF8FF\u200B-\u200F\uFEFF]/g, '')

  // 2. 移除开头 "上一章练习(题)答案" 段落
  const idx = c.indexOf('上一章练习')
  if (idx >= 0 && idx <= 5) {
    // 找到第一个非空标题行（## 开头）
    const lines = c.split('\n')
    let cutLine = -1
    for (let i = 1; i < lines.length; i++) {
      if (/^#{1,3}\s+\S/.test(lines[i])) {
        cutLine = i
        break
      }
    }
    if (cutLine > 0) {
      c = lines.slice(cutLine).join('\n')
      console.log(`[HEAD] #${id} ${title}: 移除了开头 ${cutLine} 行`)
    }
  }

  if (c !== orig) {
    await client.query('UPDATE article SET content = $1 WHERE id = $2', [c, id])
    fixCount++
    console.log(`[FIXED] #${id} ${title} (${orig.length} → ${c.length})`)
  }
}

console.log(`\n完成! 修复了 ${fixCount} 篇文章`)
client.release()
await pool.end()
