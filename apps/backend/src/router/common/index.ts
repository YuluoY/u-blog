import express, { type Router } from 'express'
import type { Request, Response } from 'express'
import CommonController from '@/controller/common'
import { toResponse } from '@/utils'
import { IUserLogin } from '@u-blog/model'

const router = express.Router() as Router

router.post('/register', async (req: Request, res: Response) => {
  const result = await CommonController.register(req, res)
  toResponse(result, res)
})

router.post('/login', async (req: Request, res: Response) => {
  const result = await CommonController.login<IUserLogin>(req, res)
  toResponse(result, res)
})

router.post('/refresh', async (req: Request, res: Response) => {
  const result = await CommonController.refreshToken(req, res)
  toResponse(result, res)
})

router.post('/chat', async (req: Request, res: Response) => {
  const result = await CommonController.chat(req, res)
  toResponse(result, res)
})

export default router