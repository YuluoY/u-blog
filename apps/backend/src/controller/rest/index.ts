import type { Request } from 'express'
import type { ControllerReturn } from '@u-blog/types'
import { formatResponse, getClientIp, getDataSource, parseUserAgent, resolveIpLocation } from '@/utils'
import { tryit } from '@u-blog/utils'
import RestService from '@/service/rest'
import { Article } from '@/module/schema/Article'

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
    const tryData = await tryit<any, Error>(() => RestService.add(req.model, data, ret))
    // 评论发表成功后，若有 articleId 则同步增加文章评论数
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