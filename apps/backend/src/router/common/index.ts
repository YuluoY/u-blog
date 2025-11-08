import express, { type Router } from 'express'
import type { Request, Response } from 'express'
import CommonController from '@/controller/common'
import { toResponse } from '@/utils'

const router = express.Router() as Router

router.post('/register', async (req: Request, res: Response) => {
  const data = await CommonController.register(req)
  toResponse(data, res)
})

router.post('/login', async (req: Request, res: Response) => {
  const data = await CommonController.login(req)
  toResponse(data, res)
})


export default router