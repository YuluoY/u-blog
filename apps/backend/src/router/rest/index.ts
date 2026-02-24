import express, { type Router } from 'express'
import type { Request, Response } from 'express'
import RestController from '@/controller/rest'
import { requireAuth } from '@/middleware/AuthGuard'
import { restWriteGuard, userSettingQueryGuard } from '@/middleware/RestWriteGuard'
import { Article } from '@/module/schema/Article'
import { getDataSource } from '@/utils'

const router = express.Router({ mergeParams: true }) as Router

/**
 * 文章密码验证：匹配密码后返回完整正文
 * POST /rest/article/verify-protect  body: { id, password }
 */
router.post('/verify-protect', async (req: Request, res: Response) => {
  // 仅 article 模型可调用
  if (req.params?.model !== 'article') {
    res.status(400).json({ code: 400, data: null, message: '仅支持文章模型' })
    return
  }
  const { id, password } = req.body || {}
  if (!id || !password) {
    res.json({ code: 1, data: null, message: '参数不完整' })
    return
  }
  try {
    const ds = getDataSource(req)
    const repo = ds.getRepository(Article)
    // 显式查询 protect 列（select: false 的列必须手动 addSelect）
    const article = await repo
      .createQueryBuilder('article')
      .addSelect('article.protect')
      .where('article.id = :id', { id: Number(id) })
      .getOne()
    if (!article) {
      res.json({ code: 1, data: null, message: '文章不存在' })
      return
    }
    if (!article.protect) {
      res.json({ code: 1, data: null, message: '该文章无密码保护' })
      return
    }
    if (article.protect !== String(password)) {
      res.json({ code: 1, data: null, message: '密码错误' })
      return
    }
    // 密码正确：返回完整正文
    res.json({ code: 0, data: { content: article.content }, message: '验证成功' })
  } catch {
    res.json({ code: 1, data: null, message: '验证失败' })
  }
})

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
