import type { Request } from 'express'
import type { ControllerReturn } from '@u-blog/types'
import { assert } from '@/utils'
import { tryit } from '@u-blog/utils'
import RestService from '@/service/rest'

class RestController
{
  async query(req: Request): ControllerReturn
  {
    const tryData = await tryit<any, Error>(() => RestService.query(req.model))
    return assert(tryData, req.__('rest.querySuccess'), req.__('rest.queryFail'))
  }
}

export default new RestController()