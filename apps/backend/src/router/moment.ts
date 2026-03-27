import { Router, type IRouter } from 'express'
import type { Request, Response } from 'express'
import { getDataSource } from '@/utils'
import { Moment } from '@/module/schema/Moment'
import { Likes } from '@/module/schema/Likes'

const router: IRouter = Router()

/**
 * 统一响应封装
 */
function toResponse(data: unknown, res: Response, code = 0, message = 'ok') {
  res.json({ code, data, message })
}

/**
 * 切换动态点赞状态
 *
 * 登录用户通过 userId 去重，游客通过 IP + fingerprint 去重。
 * 同时同步更新 Moment 表的 likeCount 计数。
 *
 * POST /moment/like
 * Body: { momentId: number, fingerprint?: string }
 */
router.post('/like', async (req: Request, res: Response) => {
  try {
    const { momentId, fingerprint } = req.body
    if (!momentId) {
      toResponse(null, res, 1, '缺少 momentId')
      return
    }

    const ds = getDataSource(req)
    const momentRepo = ds.getRepository(Moment)
    const likeRepo = ds.getRepository(Likes)

    const moment = await momentRepo.findOne({ where: { id: momentId } })
    if (!moment) {
      toResponse(null, res, 1, '动态不存在')
      return
    }

    const userId = req.user?.id ?? null
    const ip = req.ip ?? null

    /* 查找已有点赞记录：登录用户按 userId，游客按 IP + fingerprint */
    const where: Record<string, unknown> = { momentId }
    if (userId) {
      where.userId = userId
    } else {
      where.ip = ip
      if (fingerprint) where.fingerprint = fingerprint
    }

    const existing = await likeRepo.findOne({ where })

    let liked: boolean
    if (existing) {
      /* 取消点赞 */
      await likeRepo.remove(existing)
      moment.likeCount = Math.max(0, (moment.likeCount ?? 0) - 1)
      liked = false
    } else {
      /* 新增点赞 */
      const like = likeRepo.create({ momentId, userId, ip, fingerprint } as any)
      await likeRepo.save(like)
      moment.likeCount = (moment.likeCount ?? 0) + 1
      liked = true
    }

    await momentRepo.save(moment)
    toResponse({ liked, likeCount: moment.likeCount }, res)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '操作失败'
    toResponse(null, res, 1, message)
  }
})

/**
 * 查询动态点赞状态
 *
 * GET /moment/like-status?momentId=1&fingerprint=xxx
 */
router.get('/like-status', async (req: Request, res: Response) => {
  try {
    const momentId = Number(req.query.momentId)
    const fingerprint = req.query.fingerprint as string | undefined
    if (!momentId) {
      toResponse({ liked: false }, res)
      return
    }

    const ds = getDataSource(req)
    const likeRepo = ds.getRepository(Likes)

    const userId = req.user?.id ?? null
    const ip = req.ip ?? null

    const where: Record<string, unknown> = { momentId }
    if (userId) {
      where.userId = userId
    } else {
      where.ip = ip
      if (fingerprint) where.fingerprint = fingerprint
    }

    const existing = await likeRepo.findOne({ where })
    toResponse({ liked: !!existing }, res)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '查询失败'
    toResponse(null, res, 1, message)
  }
})

export default router
