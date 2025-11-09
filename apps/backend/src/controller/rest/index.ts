import type { Request } from 'express'
import type { ControllerReturn } from '@u-blog/types'
import { formatResponse } from '@/utils'
import { tryit } from '@u-blog/utils'
import RestService from '@/service/rest'

class RestController
{
  async query(req: Request): ControllerReturn
  {
    const {

    } = req.body

    const tryData = await tryit<any, Error>(() => RestService.query(req.model))
    return formatResponse(tryData, req.__('rest.querySuccess'), req.__('rest.queryFail'))
  }

  async del(req: Request): ControllerReturn
  {

  }

  async add(req: Request): ControllerReturn
  {
    const { ret = 0, ...data } = req.body
    const tryData = await tryit<any, Error>(() => RestService.add(req.model, data, ret))
    return formatResponse(tryData, req.__('rest.addSuccess'), req.__('rest.addFail'))
  }

  async update(req: Request): ControllerReturn
  {

  }
}

export default new RestController()