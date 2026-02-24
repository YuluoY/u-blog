/**
 * 文章安全清理脚本 v3
 * 只清理末尾/开头的非文章内容，绝不修改正文
 * 
 * 处理的问题：
 * 1. 末尾不完整的代码块标记（如 ```html\n 无闭合）
 * 2. 末尾残留笔记标记（如 "day 113 02"）
 * 3. SQL 系列文章末尾孤立的 "练习题答案"
 * 4. 开头的 "上一章练习题答案" 段落（属于上一篇文章）
 * 5. CSDN "在这里插入图片描述" alt 文字替换为有意义的描述
 * 6. 生活类文章中 "> 图：xxx" 占位符（图片已丢失）
 * 7. 末尾多余空行清理
 */
import { Pool } from 'pg'

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'ublog',
  password: 'Ublog2024!',
  database: 'ublog',
})

/**
 * 将 markdown 拆分为代码块和非代码块
 * 返回 [{type: 'text'|'code', content: string}, ...]
 */
function splitByCodeBlocks(content) {
  const parts = []
  const regex = /^(```[^\n]*\n[\s\S]*?^```\s*$)/gm
  let lastIdx = 0
  let match

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIdx) {
      parts.push({ type: 'text', content: content.slice(lastIdx, match.index) })
    }
    parts.push({ type: 'code', content: match[1] })
    lastIdx = match.index + match[1].length
  }
  if (lastIdx < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIdx) })
  }
  return parts
}

/**
 * 对非代码区域执行安全替换
 */
function safeReplace(content, pattern, replacement) {
  const parts = splitByCodeBlocks(content)
  let changed = false
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].type === 'text') {
      const newContent = parts[i].content.replace(pattern, replacement)
      if (newContent !== parts[i].content) {
        parts[i].content = newContent
        changed = true
      }
    }
  }
  return changed ? parts.map(p => p.content).join('') : content
}

// 针对每篇文章的具体修复规则
const FIXES = {
  // Article 14: 末尾有不完整的 ```html 代码块
  14: (c) => c.replace(/\n```html\s*$/, ''),

  // Article 24: 末尾有残留笔记 "day 113 02"
  24: (c) => c.replace(/\nday \d+ \d+\s*$/, ''),

  // SQL 系列：开头有 "上一章练习题答案" 段落（属于上一篇文章的内容）
  // SQL 系列：末尾有孤立的 "练习题答案" 占位
  39: (c) => {
    // 移除开头 "上一章练习答案" 段落 + 练习SQL代码 + 空行，直到正式章节
    c = c.replace(/^-\s*上一章练习(?:题)?答案[\s\S]*?(?=\n##?\s[^\n])/m, '')
    return c
  },
  40: (c) => {
    c = c.replace(/^-\s*上一章练习(?:题)?答案[\s\S]*?(?=\n##?\s[^\n])/m, '')
    return c
  },
  42: (c) => {
    c = c.replace(/^-\s*上一章练习(?:题)?答案[\s\S]*?(?=\n##?\s[^\n])/m, '')
    c = c.replace(/\n+练习题答案\s*$/, '')
    return c
  },
  43: (c) => {
    c = c.replace(/^-\s*上一章练习(?:题)?答案[\s\S]*?(?=\n##?\s[^\n])/m, '')
    c = c.replace(/\n+练习题答案\s*$/, '')
    return c
  },
  44: (c) => {
    c = c.replace(/^-\s*上一章练习(?:题)?答案[\s\S]*?(?=\n##?\s[^\n])/m, '')
    c = c.replace(/\n+练习题答案\s*$/, '')
    return c
  },
}

/**
 * 通用清理（所有文章都执行）
 */
function commonCleanup(content) {
  let c = content

  // 1. 替换 CSDN 默认图片 alt 文字为空（保留图片）
  c = safeReplace(c, /!\[在这里插入图片描述\]/g, '![效果图]')

  // 2. 移除 "> 图：xxx" 格式的图片占位符（图片已丢失，留着无意义）
  c = safeReplace(c, /^>\s*图[：:].+$/gm, '')

  // 3. 清理连续3个以上空行为2个
  c = c.replace(/\n{4,}/g, '\n\n\n')

  // 4. 移除末尾多余空行，保留一个换行
  c = c.trimEnd() + '\n'

  return c
}

async function main() {
  const client = await pool.connect()
  try {
    const { rows } = await client.query('SELECT id, title, content FROM article ORDER BY id')
    console.log(`共 ${rows.length} 篇文章\n`)

    let fixCount = 0

    for (const article of rows) {
      let content = article.content
      const original = content

      // 执行针对性修复
      if (FIXES[article.id]) {
        content = FIXES[article.id](content)
      }

      // 执行通用清理
      content = commonCleanup(content)

      if (content !== original) {
        await client.query('UPDATE article SET content = $1 WHERE id = $2', [content, article.id])
        const diff = original.length - content.length
        console.log(`[FIXED] #${article.id} ${article.title} (${diff > 0 ? '-' : '+'}${Math.abs(diff)} chars)`)
        fixCount++
      }
    }

    console.log(`\n完成！修复了 ${fixCount} 篇文章`)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(err => { console.error(err); process.exit(1) })
