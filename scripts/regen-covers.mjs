import { createRequire } from 'node:module'
import { randomBytes } from 'node:crypto'
import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'

const require = createRequire('/var/www/u-blog/apps/backend/node_modules/.pnpm/pg@8.16.3/node_modules/pg/')
const { Client } = require('pg')

const sharpRequire = createRequire('/var/www/u-blog/apps/backend/node_modules/.pnpm/sharp@0.33.5/node_modules/sharp/')
const sharp = sharpRequire('sharp')

const UPLOADS_DIR = '/var/www/u-blog/apps/backend/public/uploads'
const WIDTH = 1200, HEIGHT = 630

const palettes = [
  ['#5B8DEF', '#7AA2FF'], ['#7C5CFF', '#9E7BFF'], ['#00BFA6', '#5FD3BC'],
  ['#FF7A59', '#FF9F7A'], ['#E95AA8', '#F285C0'], ['#1F2A44', '#334A7D'],
  ['#FFB347', '#FFD166'], ['#2EC4B6', '#6EE7D8'], ['#8F94FB', '#B8B8FF'],
  ['#F66B6B', '#F8A5A5'], ['#43C6AC', '#6FE3CC'], ['#4E54C8', '#8F94FB'],
  ['#A770EF', '#FDB99B'], ['#30CFD0', '#91A7FF'],
]

function escapeXml(t) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function sanitize(t) {
  return t
    .replace(/(^|[\s_-])\d{10,}(?=[\s_-]|$)/g, ' ')
    .replace(/(^|[\s_-])\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?(?=[\s_-]|$)/g, ' ')
    .replace(/[\s_-]{2,}/g, ' ')
    .trim()
}

function charW(c) { return /[\u0000-\u00ff]/.test(c) ? 1 : 2 }

function wrapLines(text, max = 24, maxL = 3) {
  const n = (text || '').trim()
  if (!n) return ['无题小记']
  const lines = []
  let cur = '', u = 0
  for (const c of n) {
    const nu = u + charW(c)
    if (nu > max && cur) {
      lines.push(cur)
      if (lines.length >= maxL) break
      cur = c
      u = charW(c)
    } else {
      cur += c
      u = nu
    }
  }
  if (lines.length < maxL && cur) lines.push(cur)
  if (lines.length > maxL) lines.length = maxL
  return lines.length ? lines : ['无题小记']
}

function pickGrad() { return palettes[Math.floor(Math.random() * palettes.length)] }

async function genCover(title) {
  const raw = (title || '无题小记').trim()
  const ct = sanitize(raw) || '无题小记'
  const lines = wrapLines(ct, 24, 3)
  const y1 = lines.length === 1 ? 332 : lines.length === 2 ? 296 : 264
  const gap = 68
  const tspans = lines.map((l, i) => `<tspan x="600" dy="${i === 0 ? 0 : gap}">${escapeXml(l)}</tspan>`).join('')
  const [c1, c2] = pickGrad()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient>
<radialGradient id="mist" cx="50%" cy="35%" r="65%"><stop offset="0%" stop-color="rgba(255,255,255,0.18)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient>
<filter id="blur40" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="24"/></filter>
<clipPath id="titleClip"><rect x="170" y="214" width="860" height="240" rx="8"/></clipPath></defs>
<rect width="100%" height="100%" fill="url(#bg)"/><rect width="100%" height="100%" fill="url(#mist)"/>
<circle cx="128" cy="102" r="56" fill="rgba(255,255,255,0.20)" filter="url(#blur40)"/>
<circle cx="1046" cy="108" r="46" fill="rgba(255,255,255,0.19)" filter="url(#blur40)"/>
<circle cx="1110" cy="178" r="28" fill="rgba(255,255,255,0.15)" filter="url(#blur40)"/>
<circle cx="144" cy="452" r="72" fill="rgba(255,255,255,0.20)" filter="url(#blur40)"/>
<circle cx="968" cy="470" r="64" fill="rgba(255,255,255,0.16)" filter="url(#blur40)"/>
<text x="600" y="154" text-anchor="middle" font-size="30" letter-spacing="10" font-family="Noto Sans CJK SC,Noto Sans SC,PingFang SC,Microsoft YaHei,sans-serif" fill="rgba(255,255,255,0.86)">NOTES</text>
<line x1="516" y1="182" x2="684" y2="182" stroke="rgba(255,255,255,0.78)" stroke-width="3" stroke-linecap="round"/>
<text x="600" y="252" text-anchor="middle" font-size="38" font-family="Noto Sans CJK SC,Noto Sans SC,PingFang SC,Microsoft YaHei,sans-serif" fill="rgba(40,50,38,0.82)">✎</text>
<text x="600" y="${y1}" text-anchor="middle" clip-path="url(#titleClip)" font-size="56" font-family="Noto Sans CJK SC,Noto Sans SC,PingFang SC,Microsoft YaHei,sans-serif" fill="#ffffff" font-weight="700">${tspans}</text>
<text x="600" y="520" text-anchor="middle" font-size="40" font-family="Noto Sans CJK SC,Noto Sans SC,PingFang SC,Microsoft YaHei,sans-serif" fill="rgba(255,255,255,0.55)">uluo.cloud</text></svg>`

  if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true })
  const fname = `cover-article-${Date.now()}-${randomBytes(4).toString('hex')}.png`
  const fp = join(UPLOADS_DIR, fname)
  await sharp(Buffer.from(svg)).png({ quality: 92, compressionLevel: 9 }).toFile(fp)
  return `/uploads/${fname}`
}

async function main() {
  const client = new Client({ host: '127.0.0.1', user: 'ublog', password: 'UDWmzn3ws9gXn45r9Hmwjw', database: 'ublog' })
  await client.connect()
  const { rows } = await client.query("SELECT id, title, cover FROM article WHERE cover IS NOT NULL AND cover != '' ORDER BY id")
  let fixed = 0, skipped = 0
  for (const row of rows) {
    const basename = row.cover.split('/').pop()
    const diskPath = join(UPLOADS_DIR, basename)
    if (existsSync(diskPath)) { skipped++; continue }
    const newUrl = await genCover(row.title)
    await client.query('UPDATE article SET cover=$1 WHERE id=$2', [newUrl, row.id])
    console.log(`  Fixed id=${row.id} title="${(row.title || '').slice(0, 30)}" => ${newUrl}`)
    fixed++
    await new Promise(r => setTimeout(r, 50))
  }
  console.log(`\nDone: ${fixed} regenerated, ${skipped} already OK`)
  await client.end()
}

main().catch(e => { console.error(e); process.exit(1) })
