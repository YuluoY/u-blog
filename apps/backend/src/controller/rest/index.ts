import type { Request } from 'express'
import type { ControllerReturn } from '@u-blog/types'
import { In } from 'typeorm'
import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import sharp from 'sharp'
import appCfg from '@/app'
import { formatResponse, getClientIp, getDataSource, parseUserAgent, resolveIpLocation, decryptTransport } from '@/utils'
import { tryit } from '@u-blog/utils'
import RestService from '@/service/rest'
import CommonService from '@/service/common'
import SubscribeService from '@/service/subscribe'
import { Article } from '@/module/schema/Article'
import { Comment } from '@/module/schema/Comment'
import { Tag } from '@/module/schema/Tag'
import sanitizeHtml from 'sanitize-html'
import { USERS_SENSITIVE_FIELDS, stripSensitiveFields } from '@/middleware/RestWriteGuard'
import {
  invalidateArticleCache,
  invalidateCommentCache,
  invalidateTaxonomyCache,
  invalidateSettingsCache,
} from '@/service/cache'
import { blogKB } from '@/service/xiaohui/blogKnowledge'

const DEFAULT_COVER_WIDTH = 1200
const DEFAULT_COVER_HEIGHT = 630

/**
 * 根据模型名称触发对应的缓存失效
 * 写操作（add/update/del）成功后异步调用，不阻塞响应
 */
function invalidateCacheForModel(req: Request): void {
  const modelName = (req.params?.model || req.model?.metadata?.name || '').toLowerCase()
  switch (modelName) {
    case 'article':
      invalidateArticleCache().catch(() => {})
      blogKB.invalidate().catch(() => {})
      break
    case 'comment':
      invalidateCommentCache().catch(() => {})
      break
    case 'category':
    case 'tag':
      invalidateTaxonomyCache().catch(() => {})
      blogKB.invalidate().catch(() => {})
      break
    case 'setting':
      invalidateSettingsCache().catch(() => {})
      break
    // 其他模型暂不缓存，无需失效
  }
}

/** 评论内容允许的 HTML 标签和属性（严格白名单） */
const COMMENT_SANITIZE_OPTS: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'b', 'i', 'em', 'strong', 'a', 'code', 'pre', 'blockquote'],
  allowedAttributes: {
    a: ['href', 'title', 'rel', 'target'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
}

/**
 * IP 频率限制：同一 IP 在窗口期内最多允许的评论数
 * Map<ip, timestamp[]>
 */
const commentRateMap = new Map<string, number[]>()
/** 频率限制窗口：10 分钟 */
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
/** 窗口内最大评论条数 */
const RATE_LIMIT_MAX = 5
/** Map 最大条目数，防止内存耗尽 */
const RATE_MAP_MAX_SIZE = 10000

/** 定期清理过期的评论限流记录（每 60 秒） */
setInterval(() => {
  const now = Date.now()
  for (const [ip, timestamps] of commentRateMap) {
    const valid = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS)
    if (valid.length === 0) commentRateMap.delete(ip)
    else commentRateMap.set(ip, valid)
  }
}, 60_000)

/** 检查 IP 评论频率，返回 true 表示超限 */
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = commentRateMap.get(ip) ?? []
  // 清理过期记录
  const valid = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS)
  if (valid.length >= RATE_LIMIT_MAX) return true
  // 超出 Map 大小上限时，拒绝新 IP（防止攻击者填满内存）
  if (!commentRateMap.has(ip) && commentRateMap.size >= RATE_MAP_MAX_SIZE) return true
  valid.push(now)
  commentRateMap.set(ip, valid)
  return false
}

class RestController
{
  async query(req: Request): ControllerReturn
  {
    const tryData = await tryit<any, Error>(() => RestService.query(req.model, req))
    // Users 表查询：过滤敏感字段（password/token/rthash 等）
    if (tryData[0] == null && isUsersModel(req)) {
      sanitizeUsersResponse(tryData[1])
    }
    // Article 表查询：非管理员请求时，密码保护文章隐藏正文、暴露 isProtected 标志
    if (tryData[0] == null && isArticleModel(req)) {
      sanitizeArticleProtect(tryData[1], req)
    }
    return formatResponse(tryData, req.__('rest.querySuccess'), req.__('rest.queryFail'))
  }

  async del(req: Request): ControllerReturn
  {
    const id = Number(req.body?.id ?? req.query?.id)
    if (!id || Number.isNaN(id)) {
      return formatResponse([new Error('id 必填') as any, null], req.__('rest.delSuccess'), req.__('rest.delFail'))
    }
    const isComment = req.params?.model === 'comment' || req.model?.metadata?.name === 'Comment'
    let commentArticleId: number | null = null

    if (isComment) {
      const commentRepo = getDataSource(req).getRepository(Comment)
      const comment = await commentRepo.findOne({ where: { id }, select: ['id', 'articleId'] })
      commentArticleId = Number(comment?.articleId ?? 0) || null
    }

    const tryData = await tryit<void, Error>(() => RestService.del(req.model, id))

    if (tryData[0] == null && commentArticleId) {
      const articleRepo = getDataSource(req).getRepository(Article)
      await articleRepo
        .createQueryBuilder()
        .update(Article)
        .set({ commentCount: () => 'GREATEST("commentCount" - 1, 0)' })
        .where('id = :id', { id: commentArticleId })
        .execute()
    }

    // 删除成功后异步清除相关缓存
    if (tryData[0] == null) invalidateCacheForModel(req)
    return formatResponse(tryData, req.__('rest.delSuccess'), req.__('rest.delFail'))
  }

  async add(req: Request): ControllerReturn
  {
    const { ret = 0, ...data } = req.body
    const isComment = req.params?.model === 'comment' || req.model?.metadata?.name === 'Comment'
    const isArticle = req.model?.metadata?.name === 'Article'

    if (isComment) {
      const ip = getClientIp(req)
      const ua = req.get('User-Agent') ?? undefined
      const { browser, device } = parseUserAgent(ua)
      const ipLocation = ip ? await resolveIpLocation(ip) : null

      // 游客评论校验：必须提供 nickname + email
      if (!req.user) {
        if (!data.nickname?.trim()) {
          return formatResponse([new Error('昵称不能为空') as any, null], req.__('rest.addSuccess'), '昵称不能为空')
        }
        if (!data.email?.trim()) {
          return formatResponse([new Error('邮箱不能为空') as any, null], req.__('rest.addSuccess'), '邮箱不能为空')
        }
        // 简单邮箱格式验证
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
          return formatResponse([new Error('邮箱格式不正确') as any, null], req.__('rest.addSuccess'), '邮箱格式不正确')
        }
        // IP 频率限制
        if (ip && isRateLimited(ip)) {
          return formatResponse(
            [new Error('评论过于频繁，请稍后再试') as any, null],
            req.__('rest.addSuccess'),
            '评论过于频繁，请稍后再试'
          )
        }
        // 清理游客数据：不允许伪造 userId
        delete data.userId
      } else {
        // 登录用户：注入 userId，清理游客字段
        data.userId = req.user.id
        delete data.nickname
        delete data.email
      }

      Object.assign(data, {
        ip: ip ?? undefined,
        userAgent: ua ?? undefined,
        browser: browser ?? undefined,
        device: device ?? undefined,
        ipLocation: ipLocation ?? undefined
      })

      // 评论内容 XSS 清理：只保留安全的 HTML 标签
      if (typeof data.content === 'string') {
        data.content = sanitizeHtml(data.content, COMMENT_SANITIZE_OPTS)
      }
    }

    let payload: typeof data = data
    if (isArticle && data && typeof data === 'object' && !Array.isArray(data)) {
      const { tags: tagIds, content, ...rest } = data as Record<string, unknown>
      const processedContent = typeof content === 'string' ? CommonService.processArticleContent(content) : content
      const normalizedMeta = await normalizeArticleMeta({
        title: rest.title,
        desc: rest.desc,
        cover: rest.cover,
        content: typeof processedContent === 'string' ? processedContent : '',
      }, true)
      // 传输层解密：前端对 protect 字段加密传输，需在落库前还原明文
      if (typeof rest.protect === 'string' && rest.protect) {
        rest.protect = decryptTransport(rest.protect)
      }
      payload = {
        ...rest,
        title: normalizedMeta.title ?? 'Untitled',
        desc: normalizedMeta.desc ?? '',
        cover: normalizedMeta.cover,
        content: processedContent,
      } as typeof data
    }

    const tryData = await tryit<any, Error>(() => RestService.add(req.model, payload, ret))

    if (isArticle && tryData[0] == null && payload && typeof payload === 'object') {
      const raw = data as Record<string, unknown>
      const tagIds = Array.isArray(raw?.tags) ? (raw.tags as number[]).filter((id): id is number => Number.isInteger(id)) : []
      const saved = tryData[1]
      const id = saved?.id as number | undefined
      if (id != null && tagIds.length > 0) {
        const ds = getDataSource(req)
        const articleRepo = ds.getRepository(Article)
        const tagRepo = ds.getRepository(Tag)
        const article = await articleRepo.findOne({ where: { id } })
        if (article) {
          const tags = await tagRepo.find({ where: { id: In(tagIds) } })
          ;(article as Article & { tags?: Tag[] }).tags = tags
          await articleRepo.save(article)
        }
      }
    }

    if (isComment && tryData[0] == null && data?.articleId != null) {
      const articleId = Number(data.articleId)
      if (!Number.isNaN(articleId)) {
        const articleRepo = getDataSource(req).getRepository(Article)
        await articleRepo.increment({ id: articleId }, 'commentCount', 1)
      }
    }

    // 评论回复邮件通知：异步发送，不阻塞响应
    if (isComment && tryData[0] == null && data?.pid) {
      const parentId = Number(data.pid)
      if (!Number.isNaN(parentId)) {
        CommonService.sendCommentReplyNotification(
          req,
          parentId,
          { content: data.content, nickname: data.nickname, userId: data.userId },
          data.articleId ? Number(data.articleId) : undefined,
        ).catch(() => { /* 静默：通知失败不影响主流程 */ })
      }
    }

    // 添加成功后异步清除相关缓存
    if (tryData[0] == null) invalidateCacheForModel(req)

    // 新文章发布 → 异步通知所有订阅者
    if (isArticle && tryData[0] == null) {
      const saved = tryData[1]
      if (saved?.id && saved?.title) {
        SubscribeService.notifyNewArticle(
          getDataSource(req),
          { id: saved.id, title: saved.title, summary: saved.description || '' },
        ).catch((err) => console.error('[Subscribe] 新文章通知失败:', err))
      }
    }

    // 唯一约束冲突 → 友好提示
    humanizeDuplicateError(tryData, req)

    return formatResponse(tryData, req.__('rest.addSuccess'), req.__('rest.addFail'))
  }

  async update(req: Request): ControllerReturn
  {
    const { id, ...rest } = req.body || {}
    const numId = Number(id)
    if (!numId || Number.isNaN(numId)) {
      return formatResponse([new Error('id 必填') as any, null], req.__('rest.updateSuccess'), req.__('rest.updateFail'))
    }
    // Article protect 字段传输解密
    if (isArticleModel(req) && typeof rest.protect === 'string' && rest.protect) {
      rest.protect = decryptTransport(rest.protect)
    }
    if (isArticleModel(req)) {
      const normalizedMeta = await normalizeArticleMeta({
        title: rest.title,
        desc: rest.desc,
        cover: rest.cover,
        content: typeof rest.content === 'string' ? rest.content : '',
      }, false)
      if (normalizedMeta.title) rest.title = normalizedMeta.title
      if (normalizedMeta.desc != null) rest.desc = normalizedMeta.desc
      if (normalizedMeta.cover) rest.cover = normalizedMeta.cover
    }
    // 更新文章前先提取 tags 字段，避免传入 RestService.update 导致异常
    const isArticle = isArticleModel(req)
    const tagIds: number[] = isArticle && Array.isArray(rest.tags)
      ? (rest.tags as number[]).filter((t): t is number => Number.isInteger(t))
      : []
    if (isArticle) delete rest.tags

    const tryData = await tryit<any, Error>(() => RestService.update(req.model, numId, rest))

    // 文章 tags ManyToMany 关联更新
    if (isArticle && tryData[0] == null) {
      const ds = getDataSource(req)
      const articleRepo = ds.getRepository(Article)
      const tagRepo = ds.getRepository(Tag)
      const article = await articleRepo.findOne({ where: { id: numId }, relations: ['tags'] })
      if (article) {
        const tags = tagIds.length > 0 ? await tagRepo.find({ where: { id: In(tagIds) } }) : []
        ;(article as Article & { tags?: Tag[] }).tags = tags
        await articleRepo.save(article)
      }
    }
    // Users 表更新：过滤响应中的敏感字段
    if (tryData[0] == null && isUsersModel(req)) {
      sanitizeUsersResponse(tryData[1])
    }
    // 更新成功后异步清除相关缓存
    if (tryData[0] == null) invalidateCacheForModel(req)
    // 唯一约束冲突 → 友好提示
    humanizeDuplicateError(tryData, req)
    return formatResponse(tryData, req.__('rest.updateSuccess'), req.__('rest.updateFail'))
  }
}

/* ---------- 辅助函数 ---------- */

/** 判断当前操作的是否为 Users 模型 */
function isUsersModel(req: Request): boolean {
  return req.model?.metadata?.name === 'Users' || req.params?.model === 'users'
}

/** 判断当前操作的是否为 Article 模型 */
function isArticleModel(req: Request): boolean {
  return req.model?.metadata?.name === 'Article' || req.params?.model === 'article'
}

/** 从用户数据（单条或数组）中移除敏感字段 */
function sanitizeUsersResponse(data: any): void {
  if (!data) return
  if (Array.isArray(data)) {
    data.forEach(item => {
      if (item && typeof item === 'object') stripSensitiveFields(item, USERS_SENSITIVE_FIELDS)
    })
  } else if (typeof data === 'object') {
    stripSensitiveFields(data, USERS_SENSITIVE_FIELDS)
  }
}

/**
 * 文章密码保护处理：
 * - 管理员（super_admin / admin）保留完整数据，包括 protect 明文（用于后台编辑）
 * - 普通用户/游客：有 protect 的文章隐藏 content，添加 isProtected: true，删除 protect 明文
 */
function sanitizeArticleProtect(data: any, req: Request): void {
  if (!data) return
  // 仅超级管理员豁免密码保护，普通管理员和用户均需验证密码
  const isSuperAdmin = req.user?.role === 'super_admin'
  const items = Array.isArray(data) ? data : [data]
  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const hasProtect = !!item.protect
    if (hasProtect) {
      item.isProtected = true
      if (!isSuperAdmin) {
        // 非超级管理员：隐藏正文 + 删除密码明文
        item.content = ''
        delete item.protect
      }
      // 超级管理员：保留 protect 明文，用于后台表单编辑
    } else {
      item.isProtected = false
      delete item.protect
    }
  }
}

/**
 * 唯一约束冲突列 → 用户友好字段名映射
 * key: 数据库列名（小写），value: 显示名称
 */
const UNIQUE_COLUMN_LABELS: Record<string, string> = {
  title: '标题',
  name: '名称',
  email: '邮箱',
  username: '用户名',
}

/**
 * 拦截 PostgreSQL 唯一约束冲突（错误码 23505），替换为用户可读的错误信息。
 * 直接 in-place 修改 tryData[0] 的 message。
 */
function humanizeDuplicateError(tryData: [Error | null, any], req: Request): void {
  const err = tryData[0]
  if (!err) return
  // TypeORM 的 QueryFailedError 将 PG 错误码挂在 (err as any).code 上
  const pgCode = (err as any).code || (err as any).driverError?.code
  if (pgCode !== '23505') return

  // 从 detail 中提取冲突列名，格式: Key (column)=(value) already exists.
  const detail: string = (err as any).detail || (err as any).driverError?.detail || ''
  const colMatch = detail.match(/Key \("?(\w+)"?\)/)
  const column = colMatch ? colMatch[1].toLowerCase() : ''
  const label = UNIQUE_COLUMN_LABELS[column] || column || '字段'

  // 替换错误消息为友好文案
  err.message = `${label}已存在，请更换后重试`
}

/** 从 Markdown 中提取首个一级至六级标题 */
function extractFirstHeading(mdContent: string): string {
  const match = mdContent.match(/^#{1,6}\s+(.+)$/m)
  return match ? String(match[1]).trim() : ''
}

/** 提取摘要文本：去标记、压缩空白，保留前 N 字符 */
function extractSummary(mdContent: string, maxLen = 200): string {
  const text = mdContent
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+.*$/gm, '')
    .replace(/<[^>]+>/g, '')
    .replace(/^>\s?/gm, '')
    .replace(/[*_~]{1,3}/g, '')
    .replace(/^[-*_]{3,}$/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim()

  if (text.length <= maxLen) return text
  return `${text.slice(0, maxLen)}...`
}

/** 提取 Markdown/HTML 中首张图片链接（跳过 data URI） */
function extractFirstImage(mdContent: string): string {
  const mdImageReg = /!\[[^\]]*\]\(([^)]+)\)/g
  let match: RegExpExecArray | null
  while ((match = mdImageReg.exec(mdContent)) !== null) {
    const url = String(match[1]).trim()
    if (!url.startsWith('data:')) return url
  }

  const htmlImageReg = /<img[^>]+src=["']([^"']+)["']/gi
  while ((match = htmlImageReg.exec(mdContent)) !== null) {
    const url = String(match[1]).trim()
    if (!url.startsWith('data:')) return url
  }
  return ''
}

function pickRandomGradient(): [string, string] {
  const palettes: Array<{ colors: [string, string]; weight: number }> = [
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

  const totalWeight = palettes.reduce((sum, item) => sum + item.weight, 0)
  const seed = randomBytes(2).readUInt16BE(0) % totalWeight
  let cursor = 0
  for (const item of palettes) {
    cursor += item.weight
    if (seed < cursor) return item.colors
  }
  return palettes[0].colors
}

function sanitizeCoverTitle(text: string): string {
  return text
    .replace(/(^|[\s_-])\d{10,}(?=[\s_-]|$)/g, ' ')
    .replace(/(^|[\s_-])\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?(?=[\s_-]|$)/g, ' ')
    .replace(/[\s_-]{2,}/g, ' ')
    .trim()
}

function wrapCoverTitleLines(text: string, maxUnitsPerLine = 24, maxLines = 3): string[] {
  const normalized = (text || '').trim()
  if (!normalized) return ['无题小记']

  const lines: string[] = []
  let current = ''
  let units = 0

  const charUnits = (ch: string): number => /[\u0000-\u00ff]/.test(ch) ? 1 : 2

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

  if (lines.length < maxLines && current) {
    lines.push(current)
  }

  if (lines.length > maxLines) {
    lines.length = maxLines
  }

  const consumed = lines.join('').length
  if (consumed < normalized.length && lines.length > 0) {
    const last = lines[lines.length - 1]
    lines[lines.length - 1] = `${last.slice(0, Math.max(0, last.length - 1))}…`
  }

  return lines.length > 0 ? lines : ['无题小记']
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** 默认封面：生成与上传封面风格一致的 PNG 文件，返回 /uploads URL */
async function buildDefaultCoverFileUrl(title: string): Promise<string> {
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

<text x="600" y="154" text-anchor="middle" font-size="30" letter-spacing="10" font-family="Avenir Next,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif" fill="rgba(255,255,255,0.86)">NOTES</text>
<line x1="516" y1="182" x2="684" y2="182" stroke="rgba(255,255,255,0.78)" stroke-width="3" stroke-linecap="round"/>

<text x="600" y="252" text-anchor="middle" font-size="38" font-family="Avenir Next,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif" fill="rgba(40,50,38,0.82)">✎</text>
<text x="600" y="${firstLineY}" text-anchor="middle" clip-path="url(#titleClip)" font-size="56" font-family="Avenir Next,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif" fill="#ffffff" font-weight="700">${titleTspans}</text>

<text x="600" y="520" text-anchor="middle" font-size="40" font-family="Avenir Next,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif" fill="rgba(255,255,255,0.55)">uluo.cloud</text>
</svg>`

  const uploadsDir = join(appCfg.staticPath, 'uploads')
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true })
  }

  const filename = `cover-article-${Date.now()}-${randomBytes(4).toString('hex')}.png`
  const filePath = join(uploadsDir, filename)
  await sharp(Buffer.from(svg)).png({ quality: 92, compressionLevel: 9 }).toFile(filePath)
  return `/uploads/${filename}`
}

async function normalizeArticleMeta(input: {
  title: unknown
  desc: unknown
  cover: unknown
  content: string
}, isCreate: boolean): Promise<{ title?: string; desc?: string; cover?: string }> {
  const content = typeof input.content === 'string' ? input.content : ''
  const heading = extractFirstHeading(content)
  const summary = extractSummary(content)

  const titleFromPayload = typeof input.title === 'string' ? input.title.trim() : ''
  const descFromPayload = typeof input.desc === 'string' ? input.desc.trim() : ''
  const coverFromPayload = typeof input.cover === 'string' ? input.cover.trim() : ''

  const normalizedTitle = titleFromPayload || heading || (isCreate ? summary.slice(0, 60).replace(/\.\.\.$/, '').trim() || 'Untitled' : '')
  const normalizedDesc = descFromPayload || summary || (isCreate ? '' : undefined)
  const extractedCover = extractFirstImage(content)
  const normalizedCover = coverFromPayload || extractedCover || await buildDefaultCoverFileUrl(normalizedTitle || 'Untitled')

  return {
    title: normalizedTitle || undefined,
    desc: normalizedDesc,
    cover: normalizedCover,
  }
}

export default new RestController()