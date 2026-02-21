import type { Request } from 'express'
import type { ControllerReturn } from '@u-blog/types'
import { In } from 'typeorm'
import { formatResponse, getClientIp, getDataSource, parseUserAgent, resolveIpLocation } from '@/utils'
import { tryit } from '@u-blog/utils'
import RestService from '@/service/rest'
import CommonService from '@/service/common'
import { Article } from '@/module/schema/Article'
import { Tag } from '@/module/schema/Tag'

class RestController
{
  async query(req: Request): ControllerReturn
  {
    const tryData = await tryit<any, Error>(() => RestService.query(req.model, req))
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
      Object.assign(data, {
        ip: ip ?? undefined,
        userAgent: ua ?? undefined,
        browser: browser ?? undefined,
        device: device ?? undefined,
        ipLocation: ipLocation ?? undefined
      })
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
    return formatResponse(tryData, req.__('rest.updateSuccess'), req.__('rest.updateFail'))
  }
}

export default new RestController()