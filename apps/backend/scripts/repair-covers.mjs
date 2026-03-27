/**
 * 封面图修复脚本
 *
 * 扫描所有文章的封面引用，检测文件是否存在，
 * 对缺失的封面使用 sharp 重新生成默认封面并更新数据库。
 *
 * 用法（在 backend 容器内或本地 backend 目录）：
 *   node scripts/repair-covers.mjs [--dry-run]
 *
 * 环境变量需与后端一致（DATABASE_URL 或 DB_HOST 等）
 */

import { existsSync, mkdirSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const uploadsDir = process.env.UPLOADS_DIR || resolve(__dirname, '..', 'public', 'uploads')
const isDryRun = process.argv.includes('--dry-run')

if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true })
}

/* ── 数据库连接 ── */
const dbUrl = process.env.DATABASE_URL
const pool = new pg.Pool(
  dbUrl
    ? { connectionString: dbUrl }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USERNAME || 'ublog',
        password: process.env.DB_PASSWORD || 'ublog',
        database: process.env.DB_DATABASE || 'ublog',
      },
)

/* ── 封面生成（与 rest/index.ts 保持一致） ── */
const DEFAULT_COVER_WIDTH = 1200
const DEFAULT_COVER_HEIGHT = 600

const palettes = [
  { colors: ['#5B8DEF', '#7AA2FF'], weight: 10 },
  { colors: ['#7C5CFF', '#9E7BFF'], weight: 10 },
  { colors: ['#00BFA6', '#5FD3BC'], weight: 9 },
  { colors: ['#FF7A59', '#FF9F7A'], weight: 9 },
  { colors: ['#E95AA8', '#F285C0'], weight: 8 },
  { colors: ['#1F2A44', '#334A7D'], weight: 8 },
  { colors: ['#FFB347', '#FFD166'], weight: 7 },
  { colors: ['#2EC4B6', '#6EE7D8'], weight: 7 },
  { colors: ['#8F94FB', '#B8B8FF'], weight: 7 },
  { colors: ['#F66B6B', '#F8A5A5'], weight: 7 },
  { colors: ['#43C6AC', '#6FE3CC'], weight: 6 },
  { colors: ['#4E54C8', '#8F94FB'], weight: 6 },
  { colors: ['#A770EF', '#FDB99B'], weight: 5 },
  { colors: ['#30CFD0', '#91A7FF'], weight: 5 },
]

function pickRandomGradient() {
  const totalWeight = palettes.reduce((s, i) => s + i.weight, 0)
  const seed = randomBytes(2).readUInt16BE(0) % totalWeight
  let cursor = 0
  for (const item of palettes) {
    cursor += item.weight
    if (seed < cursor) return item.colors
  }
  return palettes[0].colors
}

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function sanitizeCoverTitle(text) {
  return text
    .replace(/(^|[\s_-])\d{10,}(?=[\s_-]|$)/g, ' ')
    .replace(/(^|[\s_-])\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?(?=[\s_-]|$)/g, ' ')
    .replace(/[\s_-]{2,}/g, ' ')
    .trim()
}

function charUnits(ch) {
  return /[\u0000-\u00ff]/.test(ch) ? 1 : 2
}

function wrapCoverTitleLines(text, maxUnitsPerLine = 24, maxLines = 3) {
  const normalized = (text || '').trim()
  if (!normalized) return ['无题小记']
  const lines = []
  let current = ''
  let units = 0
  for (const ch of normalized) {
    const nextUnits = units + charUnits(ch)
    if (nextUnits > maxUnitsPerLine && current) {
      lines.push(current)
      if (lines.length >= maxLines) break
      current = ch
      units = charUnits(ch)
    } else {
      current += ch
      units = nextUnits
    }
  }
  if (lines.length < maxLines && current) lines.push(current)
  if (lines.length > maxLines) lines.length = maxLines
  const consumed = lines.join('').length
  if (consumed < normalized.length && lines.length > 0) {
    const last = lines[lines.length - 1]
    lines[lines.length - 1] = `${last.slice(0, Math.max(0, last.length - 1))}…`
  }
  return lines.length > 0 ? lines : ['无题小记']
}

async function buildCoverPng(title) {
  const rawTitle = (title || '无题小记').trim()
  const coverTitle = sanitizeCoverTitle(rawTitle) || '无题小记'
  const titleLines = wrapCoverTitleLines(coverTitle, 24, 3)
  const firstLineY = titleLines.length === 1 ? 332 : titleLines.length === 2 ? 296 : 264
  const lineGap = 68
  const titleTspans = titleLines
    .map((line, idx) => `<tspan x="600" dy="${idx === 0 ? 0 : lineGap}">${escapeXml(line)}</tspan>`)
    .join('')
  const [startColor, endColor] = pickRandomGradient()

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${DEFAULT_COVER_WIDTH}" height="${DEFAULT_COVER_HEIGHT}" viewBox="0 0 ${DEFAULT_COVER_WIDTH} ${DEFAULT_COVER_HEIGHT}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${startColor}"/>
    <stop offset="100%" stop-color="${endColor}"/>
  </linearGradient>
  <radialGradient id="mist" cx="50%" cy="35%" r="65%">
    <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
    <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
  </radialGradient>
  <filter id="blur40" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="24"/>
  </filter>
  <clipPath id="titleClip">
    <rect x="170" y="214" width="860" height="240" rx="8"/>
  </clipPath>
</defs>
<rect width="100%" height="100%" fill="url(#bg)"/>
<rect width="100%" height="100%" fill="url(#mist)"/>
<circle cx="128" cy="102" r="56" fill="rgba(255,255,255,0.20)" filter="url(#blur40)"/>
<circle cx="1046" cy="108" r="46" fill="rgba(255,255,255,0.19)" filter="url(#blur40)"/>
<circle cx="1110" cy="178" r="28" fill="rgba(255,255,255,0.15)" filter="url(#blur40)"/>
<circle cx="144" cy="452" r="72" fill="rgba(255,255,255,0.20)" filter="url(#blur40)"/>
<circle cx="968" cy="470" r="64" fill="rgba(255,255,255,0.16)" filter="url(#blur40)"/>
<text x="600" y="154" text-anchor="middle" font-size="30" letter-spacing="10" font-family="Noto Sans CJK SC,Noto Sans SC,PingFang SC,Microsoft YaHei,Avenir Next,-apple-system,BlinkMacSystemFont,sans-serif" fill="rgba(255,255,255,0.86)">NOTES</text>
<line x1="516" y1="182" x2="684" y2="182" stroke="rgba(255,255,255,0.78)" stroke-width="3" stroke-linecap="round"/>
<text x="600" y="252" text-anchor="middle" font-size="38" font-family="Noto Sans CJK SC,Noto Sans SC,PingFang SC,Microsoft YaHei,Avenir Next,-apple-system,BlinkMacSystemFont,sans-serif" fill="rgba(40,50,38,0.82)">✎</text>
<text x="600" y="${firstLineY}" text-anchor="middle" clip-path="url(#titleClip)" font-size="56" font-family="Noto Sans CJK SC,Noto Sans SC,PingFang SC,Microsoft YaHei,Avenir Next,-apple-system,BlinkMacSystemFont,sans-serif" fill="#ffffff" font-weight="700">${titleTspans}</text>
<text x="600" y="520" text-anchor="middle" font-size="40" font-family="Noto Sans CJK SC,Noto Sans SC,PingFang SC,Microsoft YaHei,Avenir Next,-apple-system,BlinkMacSystemFont,sans-serif" fill="rgba(255,255,255,0.55)">uluo.cloud</text>
</svg>`

  const filename = `cover-article-${Date.now()}-${randomBytes(4).toString('hex')}.png`
  const filePath = join(uploadsDir, filename)
  await sharp(Buffer.from(svg)).png({ quality: 92, compressionLevel: 9 }).toFile(filePath)
  return `/uploads/${filename}`
}

/* ── 主流程 ── */
async function main() {
  console.log(`[repair-covers] uploads 目录: ${uploadsDir}`)
  console.log(`[repair-covers] 模式: ${isDryRun ? 'DRY RUN（仅检测）' : '实际修复'}`)
  console.log()

  const { rows } = await pool.query(
    `SELECT id, title, cover FROM article WHERE cover IS NOT NULL AND cover != '' ORDER BY id`,
  )

  let missing = 0
  let fixed = 0

  for (const row of rows) {
    const fname = row.cover.split('/').pop()
    const filePath = join(uploadsDir, fname)
    if (existsSync(filePath)) continue

    missing++
    const title = row.title || '无题小记'
    console.log(`[MISSING] article ${row.id} "${title}" → ${row.cover}`)

    if (!isDryRun) {
      try {
        const newCover = await buildCoverPng(title)
        await pool.query(`UPDATE article SET cover = $1 WHERE id = $2`, [newCover, row.id])
        console.log(`  ✓ 已修复 → ${newCover}`)
        fixed++
      } catch (err) {
        console.error(`  ✗ 修复失败: ${err.message}`)
      }
    }
  }

  console.log()
  console.log(`[repair-covers] 总计: ${rows.length} 篇有封面, ${missing} 篇缺失`)
  if (!isDryRun) {
    console.log(`[repair-covers] 已修复: ${fixed} 篇`)
  }

  await pool.end()
}

main().catch((err) => {
  console.error('[repair-covers] 致命错误:', err)
  process.exit(1)
})
