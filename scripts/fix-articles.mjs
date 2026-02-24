/**
 * 文章修复脚本 - 两大功能：
 * 1. 清理 CSDN 迁移残留的 HTML 标签和多余空白
 * 2. 为没有封面的文章生成精美渐变封面图
 *
 * 在服务器 backend 目录下运行：node fix-articles.mjs
 */
import { Pool } from 'pg'
import sharp from 'sharp'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// ==================== 数据库连接 ====================
const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'ublog',
  password: 'Ublog2024!',
  database: 'ublog',
})

// ==================== 上传目录 ====================
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true })

// ==================== 第一部分：内容格式清理 ====================

/**
 * 清理 CSDN 迁移残留内容（不修改文章正文）
 * - 移除尾部 <div class="vip-limited-time-offer-box-new" 等 HTML 残留
 * - 移除 CSDN 目录块（#### 目录 + 锚点列表）
 * - 清理多余尾部空白行
 */
function cleanContent(content) {
  let cleaned = content

  // 1. 移除尾部 CSDN HTML 残留（从连续空行开始到 <div class= 结束）
  //    典型格式：多个空行 + 空格缩进 + </div> 标签 + <div class="vip-...
  cleaned = cleaned.replace(
    /\n\s*\n\s*\n\s*\n\s*<\/?\s*div[^>]*>[\s\S]*$/gm,
    ''
  )
  // 更激进的清理：匹配末尾的 HTML 标签块
  cleaned = cleaned.replace(
    /[\s\n]*<\s*div\s+class="vip-limited-time-offer-box-new[\s\S]*$/,
    ''
  )
  // 清理末尾残留的闭合标签和空白
  cleaned = cleaned.replace(/[\s\n]*<\/?\s*div[^>]*>[\s\n]*$/g, '')

  // 2. 移除 CSDN 自动生成的目录块
  //    格式：#### 目录\n\n \n- [标题](#anchor)\n- ...\n\n \n
  cleaned = cleaned.replace(
    /####\s*目录\s*\n+(?:\s*\n)*(?:\s*-\s*\[.*?\]\(#.*?\)\s*\n)+(?:\s*\n)*/g,
    ''
  )

  // 3. 清理 CSDN 图片中的 #pic_center 后缀
  cleaned = cleaned.replace(/#pic_center\)/g, ')')

  // 4. 将连续3个以上空行缩减为2个
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n')

  // 5. 移除尾部多余空白
  cleaned = cleaned.trimEnd() + '\n'

  return cleaned
}

// ==================== 第二部分：封面图生成 ====================

/**
 * 文章主题配色方案 - 每个主题有渐变色和图标
 */
const THEMES = {
  reading:    { colors: ['#667eea', '#764ba2'], icon: '📚', label: 'Reading' },
  life:       { colors: ['#f093fb', '#f5576c'], icon: '✨', label: 'Life' },
  travel:     { colors: ['#4facfe', '#00f2fe'], icon: '✈️', label: 'Travel' },
  wedding:    { colors: ['#fa709a', '#fee140'], icon: '💒', label: 'Wedding' },
  sports:     { colors: ['#43e97b', '#38f9d7'], icon: '🏓', label: 'Sports' },
  gaming:     { colors: ['#a18cd1', '#fbc2eb'], icon: '🎮', label: 'Gaming' },
  skiing:     { colors: ['#89f7fe', '#66a6ff'], icon: '⛷️', label: 'Skiing' },
  thinking:   { colors: ['#a1c4fd', '#c2e9fb'], icon: '💭', label: 'Thinking' },
  interview:  { colors: ['#ffecd2', '#fcb69f'], icon: '💼', label: 'Career' },
  writing:    { colors: ['#d4fc79', '#96e6a1'], icon: '✏️', label: 'Notes' },
  housing:    { colors: ['#fbc2eb', '#a6c1ee'], icon: '🏠', label: 'Life' },
  vue:        { colors: ['#42b883', '#35495e'], icon: '', label: 'Vue.js' },
  react:      { colors: ['#61dafb', '#282c34'], icon: '', label: 'React' },
  nodejs:     { colors: ['#68a063', '#333333'], icon: '', label: 'Node.js' },
  nestjs:     { colors: ['#e0234e', '#1a1a2e'], icon: '', label: 'NestJS' },
  nginx:      { colors: ['#009639', '#003d1a'], icon: '', label: 'Nginx' },
  sql:        { colors: ['#00758f', '#f29111'], icon: '', label: 'SQL' },
  css:        { colors: ['#264de4', '#2965f1'], icon: '', label: 'CSS' },
  vscode:     { colors: ['#007acc', '#1e1e1e'], icon: '', label: 'VS Code' },
  javascript: { colors: ['#f7df1e', '#323330'], icon: '', label: 'JavaScript' },
  webpack:    { colors: ['#8dd6f9', '#1c78c0'], icon: '', label: 'Webpack' },
  python:     { colors: ['#3776ab', '#ffd43b'], icon: '', label: 'Python' },
  docker:     { colors: ['#2496ed', '#003f8a'], icon: '', label: 'Docker' },
  mongodb:    { colors: ['#4db33d', '#3f3e42'], icon: '', label: 'MongoDB' },
  music:      { colors: ['#e74c3c', '#c0392b'], icon: '🎵', label: 'Music' },
  algorithm:  { colors: ['#6c5ce7', '#a29bfe'], icon: '', label: 'Algorithm' },
  architecture: { colors: ['#00b894', '#00cec9'], icon: '', label: 'Architecture' },
  vite:       { colors: ['#646cff', '#bd34fe'], icon: '', label: 'Vite' },
  express:    { colors: ['#000000', '#444444'], icon: '', label: 'Express' },
  java:       { colors: ['#ed8b00', '#5382a1'], icon: '', label: 'Java' },
  general:    { colors: ['#6366f1', '#8b5cf6'], icon: '💻', label: 'Tech' },
}

/**
 * 根据文章标题自动匹配主题
 */
function detectTheme(title) {
  const t = title.toLowerCase()
  if (/路遥|余华|读后感|书海/.test(title)) return 'reading'
  if (/婚礼|婚宴/.test(title)) return 'wedding'
  if (/乒乓|运动|比赛/.test(title)) return 'sports'
  if (/长沙|旅[行途]|去.*[城市]/.test(title)) return 'travel'
  if (/lol|游戏|总决赛/.test(title)) return 'gaming'
  if (/滑雪/.test(title)) return 'skiing'
  if (/迷茫|焦虑|思考/.test(title)) return 'thinking'
  if (/面试|求职/.test(title)) return 'interview'
  if (/无题|小记/.test(title)) return 'writing'
  if (/租房|日记/.test(title) && /武汉|北京|上海/.test(title)) return 'housing'
  if (/工作日常/.test(title)) return 'life'
  if (/docker/i.test(title)) return 'docker'
  if (/nginx/i.test(title)) return 'nginx'
  if (/mongodb/i.test(title)) return 'mongodb'
  if (/nestjs/i.test(title)) return 'nestjs'
  if (/express/i.test(title)) return 'express'
  if (/vue|vue3|vue-router|watch|bus|axios.*vue|vue.*cli/i.test(title)) return 'vue'
  if (/react|setState/i.test(title)) return 'react'
  if (/node\.?js|nodejs|cors|jsonp|留言簿|热更新/i.test(title)) return 'nodejs'
  if (/vite/i.test(title)) return 'vite'
  if (/webpack/i.test(title)) return 'webpack'
  if (/sql|触发器|存储过程|函数.*精通/i.test(title)) return 'sql'
  if (/sass|bem|css/i.test(title)) return 'css'
  if (/vs\s?code/i.test(title)) return 'vscode'
  if (/promise|this.*解密|字符串.*分隔/i.test(title)) return 'javascript'
  if (/kmp|算法|反转数组/i.test(title)) return 'algorithm'
  if (/微内核|架构/i.test(title)) return 'architecture'
  if (/python|pyecharts|pip/i.test(title)) return 'python'
  if (/音乐|播放器|网易云/i.test(title)) return 'music'
  if (/jsp|java/i.test(title)) return 'java'
  if (/瀑布流|前端.*项目|组织.*模块|动态导出/i.test(title)) return 'vue'
  if (/vscode.*插件|插件.*vscode/i.test(title)) return 'vscode'
  if (/文件上传/i.test(title)) return 'nodejs'
  if (/脚本.*禁止|无法加载/i.test(title)) return 'general'
  return 'general'
}

/**
 * 生成 SVG 封面图
 * @param {string} title 文章标题
 * @param {object} theme 主题配色
 * @returns {string} SVG 字符串
 */
function generateCoverSVG(title, theme) {
  const [c1, c2] = theme.colors
  const icon = theme.icon
  const label = theme.label

  // 截断标题，防止过长
  const maxLen = 28
  let displayTitle = title
  let titleLine2 = ''
  if (title.length > maxLen) {
    // 尝试在合适的位置断行
    const breakPoints = ['：', '—', '·', '、', ' ', '之', '与', '和', '从']
    let breakIdx = -1
    for (const bp of breakPoints) {
      const idx = title.indexOf(bp, Math.floor(maxLen * 0.4))
      if (idx > 0 && idx < maxLen + 5) {
        breakIdx = idx + bp.length
        break
      }
    }
    if (breakIdx > 0) {
      displayTitle = title.substring(0, breakIdx)
      titleLine2 = title.substring(breakIdx).trim()
      if (titleLine2.length > maxLen) {
        titleLine2 = titleLine2.substring(0, maxLen - 1) + '…'
      }
    } else {
      displayTitle = title.substring(0, maxLen) + '…'
    }
  }

  // 转义 XML 特殊字符
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const titleY = titleLine2 ? 280 : 300
  const line2SVG = titleLine2
    ? `<text x="600" y="${titleY + 52}" font-family="'PingFang SC','Microsoft YaHei','Noto Sans CJK SC',sans-serif" font-size="32" fill="white" text-anchor="middle" opacity="0.95">${esc(titleLine2)}</text>`
    : ''

  // 装饰元素 - 几何图形
  const decorations = `
    <circle cx="1050" cy="100" r="60" fill="white" opacity="0.06"/>
    <circle cx="1100" cy="180" r="35" fill="white" opacity="0.04"/>
    <circle cx="150" cy="450" r="80" fill="white" opacity="0.05"/>
    <circle cx="80" cy="380" r="30" fill="white" opacity="0.04"/>
    <rect x="900" y="380" width="120" height="120" rx="20" fill="white" opacity="0.04" transform="rotate(15 960 440)"/>
    <rect x="50" y="80" width="80" height="80" rx="15" fill="white" opacity="0.03" transform="rotate(-20 90 120)"/>
  `

  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c1};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${c2};stop-opacity:1"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  ${decorations}
  <text x="600" y="160" font-family="'PingFang SC','Microsoft YaHei',sans-serif" font-size="18" fill="white" text-anchor="middle" opacity="0.7" letter-spacing="4">${esc(label.toUpperCase())}</text>
  <line x1="560" y1="185" x2="640" y2="185" stroke="white" stroke-width="2" opacity="0.4"/>
  ${icon ? `<text x="600" y="240" font-size="48" text-anchor="middle">${icon}</text>` : ''}
  <text x="600" y="${titleY}" font-family="'PingFang SC','Microsoft YaHei','Noto Sans CJK SC',sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle" filter="url(#shadow)">${esc(displayTitle)}</text>
  ${line2SVG}
  <text x="600" y="520" font-family="'PingFang SC','Microsoft YaHei',sans-serif" font-size="16" fill="white" text-anchor="middle" opacity="0.5">uluo.cloud</text>
</svg>`
}

/**
 * 生成封面图文件
 * @returns {string} 相对路径 /uploads/cover-xxx.png
 */
async function generateCover(articleId, title) {
  const themeName = detectTheme(title)
  const theme = THEMES[themeName]
  const svg = generateCoverSVG(title, theme)
  const filename = `cover-article-${articleId}.png`
  const filepath = join(UPLOAD_DIR, filename)

  await sharp(Buffer.from(svg))
    .resize(1200, 630)
    .png({ quality: 90, compressionLevel: 6 })
    .toFile(filepath)

  return `/uploads/${filename}`
}

// ==================== 主逻辑 ====================

async function main() {
  const client = await pool.connect()
  try {
    // 获取所有文章
    const { rows: articles } = await client.query(
      'SELECT id, title, cover, content FROM article ORDER BY id'
    )
    console.log(`共 ${articles.length} 篇文章`)

    let formatFixed = 0
    let coversGenerated = 0

    for (const article of articles) {
      const updates = {}

      // === 内容格式清理 ===
      const cleaned = cleanContent(article.content)
      if (cleaned !== article.content) {
        updates.content = cleaned
        formatFixed++
        console.log(`[FORMAT] #${article.id} ${article.title} - 已清理`)
      }

      // === 封面图生成（仅无封面的文章）===
      if (!article.cover) {
        try {
          const coverPath = await generateCover(article.id, article.title)
          updates.cover = coverPath
          coversGenerated++
          console.log(`[COVER]  #${article.id} ${article.title} → ${coverPath}`)
        } catch (err) {
          console.error(`[ERROR]  #${article.id} 封面生成失败:`, err.message)
        }
      }

      // === 应用更新 ===
      const keys = Object.keys(updates)
      if (keys.length > 0) {
        const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(', ')
        const values = keys.map(k => updates[k])
        values.push(article.id)
        await client.query(
          `UPDATE article SET ${setClauses} WHERE id = $${values.length}`,
          values
        )
      }
    }

    console.log(`\n完成！格式修复: ${formatFixed} 篇, 封面生成: ${coversGenerated} 篇`)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(err => {
  console.error('脚本执行失败:', err)
  process.exit(1)
})
