/**
 * 修复 SQL 系列文章开头的 "上一章练习答案" 段落
 * 直接用 indexOf 定位，避免正则编码问题
 */
import { Pool } from 'pg'
const pool = new Pool({host:'127.0.0.1',port:5432,user:'ublog',password:'Ublog2024!',database:'ublog'})

const client = await pool.connect()
const ids = [39, 40, 42, 43, 44]

for (const id of ids) {
  const { rows } = await client.query('SELECT content FROM article WHERE id = $1', [id])
  if (!rows.length) continue
  let content = rows[0].content

  // 检查开头是否有 "上一章练习" 段落
  if (content.startsWith('- 上一章练习')) {
    // 找到第一个正式标题（## 开头的行）
    const lines = content.split('\n')
    let cutIdx = -1
    for (let i = 1; i < lines.length; i++) {
      if (/^#{1,3}\s+\S/.test(lines[i])) {
        cutIdx = i
        break
      }
    }
    if (cutIdx > 0) {
      const newContent = lines.slice(cutIdx).join('\n')
      await client.query('UPDATE article SET content = $1 WHERE id = $2', [newContent, id])
      const removed = lines.slice(0, cutIdx).join('\n').trim()
      console.log(`[FIXED] #${id}: 移除了 ${cutIdx} 行开头内容 (${removed.length} chars)`)
      console.log(`  移除内容预览: ${removed.slice(0, 80)}...`)
    } else {
      console.log(`[SKIP] #${id}: 找不到正式标题行`)
    }
  } else {
    console.log(`[OK] #${id}: 开头正常，无需修改`)
  }
}

client.release()
await pool.end()
console.log('\n完成!')
