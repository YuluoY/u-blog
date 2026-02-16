import type { Request, Response } from 'express'
import type { ControllerReturn } from '@u-blog/types'
import { tryit } from '@u-blog/utils'
import { formatResponse, getDataSource } from '@/utils'
import CommonService from '@/service/common'
import { Users } from '@/module/schema/Users'
import { Repository } from 'typeorm'
import { IUserLogin } from '@u-blog/model'
import appCfg from '@/app'

class CommonController {
  async register(req: Request, res: Response): ControllerReturn
  {
    const { ret = 0, ...data } = req.body
    const userRepo = getDataSource(req).getRepository(Users) as Repository<Users>
    const tryData = await tryit<any, Error>(() => CommonService.register(req, userRepo, data, Number(ret)))
    if (tryData[1])
      this.setCookie(res, tryData[1])
    return formatResponse(tryData, req.__('common.registerSuccess'), req.__('common.registerFail'))
  }

  async login<T = IUserLogin>(req: Request, res: Response): ControllerReturn<T>
  {
    const { username, password } = req.body
    const userRepo = getDataSource(req).getRepository(Users) as Repository<Users>
    const tryData = await tryit<any, Error>(() => CommonService.login(req, userRepo, { username, password }))
    if (tryData[1])
      this.setCookie(res, tryData[1])
    return formatResponse(tryData, req.__('common.loginSuccess'), req.__('common.loginFail'))
  }

  async refreshToken(req: Request, res: Response): ControllerReturn
  {
    const userRepo = getDataSource(req).getRepository(Users) as Repository<Users>
    const tryData = await tryit<any, Error>(() => CommonService.refreshToken(req, userRepo))
    if (tryData[1])
      this.setCookie(res, tryData[1])
    return formatResponse(tryData, req.__('common.refreshTokenSuccess'), req.__('common.refreshTokenFail'), undefined, { skipErrorLog: true })
  }

  /** 博客 AI 助手：接收用户消息，返回回复（可扩展接入 OpenAI 等） */
  async chat(req: Request, _res: Response): ControllerReturn<{ reply: string }>
  {
    const { message } = req.body || {}
    const text = typeof message === 'string' ? message.trim() : ''
    const reply = text
      ? `收到：${text}\n\n（当前为演示回复，可在后端接入 OpenAI/本地模型实现真实对话）`
      : '请发送文本消息。'
    return formatResponse([null, { reply }], 'ok', 'fail')
  }

  private setCookie(res: Response, data: any): void
  {
    if (data?.rt)
    {
      res.cookie('rt', data.rt, appCfg.plugins.cookie)
      delete data.rt
    }
  }
}

export default new CommonController()