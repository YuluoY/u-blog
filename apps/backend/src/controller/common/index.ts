import type { Request } from 'express'
import type { ControllerReturn } from '@u-blog/types'
import { tryit } from '@u-blog/utils'
import { assert, getDataSource } from '@/utils'
import CommonService from '@/service/common'
import { Users } from '@/module/schema/Users'
import { Repository } from 'typeorm'

class CommonController {
  async register(req: Request): ControllerReturn
  {
    const { ret = 0, ...data } = req.body
    const userRepo = getDataSource(req).getRepository(Users) as Repository<Users>
    const tryData = await tryit<any, Error>(() => CommonService.register(userRepo, data, ret))
    return assert(tryData, req.__('common.registerSuccess'), req.__('common.registerFail'))
  }
}

export default new CommonController()