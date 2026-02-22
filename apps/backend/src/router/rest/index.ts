import express, { type Router } from 'express'
import type { Request, Response } from 'express'
import RestController from '@/controller/rest'
import { requireAuth } from '@/middleware/AuthGuard'

const router = express.Router() as Router

/**
 * 通用查询（公开）
 */
router.post('/query', async (req: Request, res: Response) => {
  const data = await RestController.query(req)
  res.json(data)
})

/**
 * 通用删除（需要登录）
 */
router.delete('/del', requireAuth, async (req: Request, res: Response) => {
  const data = await RestController.del(req)
  res.json(data)
})

/**
 * 通用添加：
 * - comment 模型允许游客（通过 nickname + email），由 Controller 校验
 * - 其他模型仍需登录
 */
router.post('/add', async (req: Request, res: Response) => {
  const isComment = req.params?.model === 'comment' || req.model?.metadata?.name === 'Comment'
  if (!isComment && !req.user) {
    res.status(401).json({ code: 401, data: null, message: '请先登录' })
    return
  }
  const data = await RestController.add(req)
  res.json(data)
})

/**
 * 通用修改（需要登录）
 */
router.put('/update', requireAuth, async (req: Request, res: Response) => {
  const data = await RestController.update(req)
  res.json(data)
})

export default router
