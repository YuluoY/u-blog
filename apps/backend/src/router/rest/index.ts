import express, { type Router } from 'express'
import type { Request, Response } from 'express'
import RestController from '@/controller/rest'
import { requireAuth } from '@/middleware/AuthGuard'
import { restWriteGuard, userSettingQueryGuard } from '@/middleware/RestWriteGuard'

const router = express.Router({ mergeParams: true }) as Router

/**
 * 通用查询（公开）
 * user_setting 查询自动注入 userId 隔离
 */
router.post('/query', userSettingQueryGuard, async (req: Request, res: Response) => {
  const data = await RestController.query(req)
  res.json(data)
})

/**
 * 通用删除（需要登录 + 写操作权限守卫）
 */
router.delete('/del', requireAuth, restWriteGuard, async (req: Request, res: Response) => {
  const data = await RestController.del(req)
  res.json(data)
})

/**
 * 通用添加：
 * - comment 模型允许游客（通过 nickname + email），由 Controller 校验
 * - 其他模型仍需登录 + 写操作权限守卫
 */
router.post('/add', async (req: Request, res: Response) => {
  const isComment = req.params?.model === 'comment' || req.model?.metadata?.name === 'Comment'
  if (!isComment && !req.user) {
    res.status(401).json({ code: 401, data: null, message: '请先登录' })
    return
  }
  // 非 comment 的 add 操作经过写守卫
  if (!isComment && req.user) {
    const { restWriteGuard: guard } = await import('@/middleware/RestWriteGuard')
    await new Promise<void>((resolve, reject) => {
      guard(req, res, (err?: any) => err ? reject(err) : resolve())
    })
    if (res.headersSent) return
  }
  const data = await RestController.add(req)
  res.json(data)
})

/**
 * 通用修改（需要登录 + 写操作权限守卫）
 */
router.put('/update', requireAuth, restWriteGuard, async (req: Request, res: Response) => {
  const data = await RestController.update(req)
  res.json(data)
})

export default router
