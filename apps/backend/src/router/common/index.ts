import express, { type Router } from 'express'
import type { Request, Response } from 'express'
import CommonController from '@/controller/common'

const router = express.Router() as Router

router.post('/register', async (req: Request, res: Response) => {
  const data = await CommonController.register(req)
  res.json(data)
})


export default router