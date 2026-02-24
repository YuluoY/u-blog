/**
 * 文章深度清理脚本 v2
 * 解决上一轮清理未处理干净的 CSDN 残留问题
 *
 * 在服务器 backend 目录下运行：node fix-articles-v2.mjs
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
 * 深度清理文章内容
 * 原则：只清理 CSDN 迁移残留，不修改文章正文
 */
function deepClean(content) {
  let c = content

  // ===== 1. 清理末尾 CSDN VIP 推广块 =====
  // 从 MathJax / script / HTML标签开始到末尾的 CSDN 内容
  // 典型模式：大段 JS + VIP 弹窗 HTML
  c = c.replace(/\s*<script[\s\S]*$/gi, '')
  c = c.replace(/\s*\$\(function\(\)\s*\{[\s\S]*$/g, '')
  
  // 清理 "确定要放弃本次机会" VIP弹窗
  c = c.replace(/\s*!\[.*?vip-limited[\s\S]*$/gi, '')
  
  // 清理 "立减 ¥" VIP推广
  c = c.replace(/\s*立减\s*¥[\s\S]*?\[立即使用\]\(https:\/\/mall\.csdn\.net[\s\S]*$/g, '')
  
  // 清理从 csdnimg.cn/release/blogv2 开始的尾部块
  c = c.replace(/\s*!\[\]\(https:\/\/csdnimg\.cn\/release\/blogv2[\s\S]*$/g, '')

  // ===== 2. 清理"本文章已经生成可运行项目"徽标 =====
  c = c.replace(/\s*本文章已经生成可运行项目[\s\S]*$/g, '')

  // ===== 3. 清理 CSDN "您可能感兴趣" 推荐块 =====
  c = c.replace(/\s*您可能感兴趣的与本文相关[\s\S]*$/g, '')

  // ===== 4. 清理 CSDN 分享链接尾部 =====
  // [链接文本](https://blog.csdn.net/...?csdn_share_tail=...)
  c = c.replace(/\[([^\]]*)\]\(https?:\/\/blog\.csdn\.net\/[^)]*csdn_share_tail=[^)]*\)/g, (_, text) => {
    // 保留链接文字但去掉CSDN链接
    return text
  })

  // ===== 5. 清理 CSDN 目录块（#### 目录 + 链接列表）=====
  c = c.replace(
    /####\s*目录\s*\n+(?:[\s\n]*(?:-\s*\[.*?\]\(#.*?\)|\s+)\s*\n)*(?:\s*\n)*/g,
    ''
  )

  // ===== 6. 清理 CSDN 图片后缀 =====
  c = c.replace(/#pic_center\)/g, ')')

  // ===== 7. 清理末尾残留的 HTML 标签 =====
  // 匹配末尾的 HTML 块（连续空白 + HTML标签）
  c = c.replace(/(?:\s*\n)+\s*(?:<\/?(?:div|span|script|img|a|p|br|section|article|button|input|form|label|table|tr|td|th|ul|ol|li|h[1-6]|pre|code)[^>]*>\s*)+[\s\S]*$/gi, '')

  // ===== 8. 清理 CSDN 内联样式和特殊标签残留 =====
  c = c.replace(/<var[\s\S]*?<\/var>/g, '')
  c = c.replace(/<\/?\s*(div|span)\s*>/g, '')
  
  // 清理 MathJax 相关脚本残留
  c = c.replace(/\s*var\s+mathcodeList[\s\S]*?MathJax\.Hub[\s\S]*?}\s*,\s*\d+\s*\)[\s\S]*$/g, '')

  // ===== 9. 清理全角空格多余行（CSDN 常见 `\n \n`） =====
  // 连续 3+ 个只含空格/全角空格的行，缩减为 2 个空行
  c = c.replace(/(\n[\s　]*){4,}/g, '\n\n\n')

  // ===== 10. 清理零宽字符 =====
  c = c.replace(/[\u200B\u200C\u200D\uFEFF]/g, '')

  // ===== 11. 清理 [练习题答案](#) 无效锚点 =====
  c = c.replace(/\[练习题答案\]\(#\)/g, '')

  // ===== 12. 末尾整理 =====
  c = c.trimEnd() + '\n'

  return c
}

async function main() {
  const client = await pool.connect()
  try {
    const { rows } = await client.query('SELECT id, title, content FROM article ORDER BY id')
    console.log(`共 ${rows.length} 篇文章待审查\n`)

    let fixed = 0
    for (const row of rows) {
      const cleaned = deepClean(row.content)
      if (cleaned !== row.content) {
        const oldLen = row.content.length
        const newLen = cleaned.length
        const diff = oldLen - newLen
        await client.query('UPDATE article SET content = $1 WHERE id = $2', [cleaned, row.id])
        console.log(`[FIXED] #${row.id} ${row.title}  (${oldLen} → ${newLen}, -${diff} chars)`)
        fixed++
      } else {
        console.log(`[OK]    #${row.id} ${row.title}`)
      }
    }

    console.log(`\n完成！修复了 ${fixed} 篇文章`)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(err => {
  console.error('脚本执行失败:', err)
  process.exit(1)
})
