import type { Request } from 'express'
import type { ControllerReturn } from '@u-blog/types'
import { formatResponse, getClientIp, parseUserAgent, resolveIpLocation } from '@/utils'
import { tryit } from '@u-blog/utils'
import RestService from '@/service/rest'

class RestController
{
  async query(req: Request): ControllerReturn
  {
    const tryData = await tryit<any, Error>(() => RestService.query(req.model, req))
    return formatResponse(tryData, req.__('rest.querySuccess'), req.__('rest.queryFail'))
  }

  async del(req: Request): ControllerReturn
  {
    const tryData = await tryit<any, Error>(() => Promise.resolve(null))
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
    return formatResponse(tryData, req.__('rest.addSuccess'), req.__('rest.addFail'))
  }

  async update(req: Request): ControllerReturn
  {
    const tryData = await tryit<any, Error>(() => Promise.resolve(null))
    return formatResponse(tryData, req.__('rest.updateSuccess'), req.__('rest.updateFail'))
  }
}

export default new RestController()