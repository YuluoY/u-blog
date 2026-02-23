import type { Request } from 'express'
import type { ControllerReturn } from '@u-blog/types'
import { In } from 'typeorm'
import { formatResponse, getClientIp, getDataSource, parseUserAgent, resolveIpLocation } from '@/utils'
import { tryit } from '@u-blog/utils'
import RestService from '@/service/rest'
import CommonService from '@/service/common'
import { Article } from '@/module/schema/Article'
import { Tag } from '@/module/schema/Tag'
import sanitizeHtml from 'sanitize-html'
import { USERS_SENSITIVE_FIELDS, stripSensitiveFields } from '@/middleware/RestWriteGuard'

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
    return formatResponse(tryData, req.__('rest.querySuccess'), req.__('rest.queryFail'))
  }

  async del(req: Request): ControllerReturn
  {
    const id = Number(req.body?.id ?? req.query?.id)
    if (!id || Number.isNaN(id)) {
      return formatResponse([new Error('id 必填') as any, null], req.__('rest.delSuccess'), req.__('rest.delFail'))
    }
    const tryData = await tryit<void, Error>(() => RestService.del(req.model, id))
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
      payload = { ...rest, content: processedContent } as typeof data
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

    return formatResponse(tryData, req.__('rest.addSuccess'), req.__('rest.addFail'))
  }

  async update(req: Request): ControllerReturn
  {
    const { id, ...rest } = req.body || {}
    const numId = Number(id)
    if (!numId || Number.isNaN(numId)) {
      return formatResponse([new Error('id 必填') as any, null], req.__('rest.updateSuccess'), req.__('rest.updateFail'))
    }
    const tryData = await tryit<any, Error>(() => RestService.update(req.model, numId, rest))
    // Users 表更新：过滤响应中的敏感字段
    if (tryData[0] == null && isUsersModel(req)) {
      sanitizeUsersResponse(tryData[1])
    }
    return formatResponse(tryData, req.__('rest.updateSuccess'), req.__('rest.updateFail'))
  }
}

/* ---------- 辅助函数 ---------- */

/** 判断当前操作的是否为 Users 模型 */
function isUsersModel(req: Request): boolean {
  return req.model?.metadata?.name === 'Users' || req.params?.model === 'users'
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

export default new RestController()