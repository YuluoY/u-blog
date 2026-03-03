import { Router, type Request, type Response } from 'express'
import { getDataSource } from '@/utils'
import SubscribeService from '@/service/subscribe'
import rateLimit from 'express-rate-limit'

const router: Router = Router()

/** 订阅接口限流：同 IP 每小时最多 10 次 */
const subscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, data: null, message: '操作过于频繁，请稍后再试' },
  validate: { trustProxy: false },
})

/**
 * POST /subscribe
 * 创建新订阅（发送验证邮件）
 * Body: { email: string, name?: string }
 */
router.post('/', subscribeLimiter, async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body || {}

    if (!email?.trim()) {
      res.json({ code: 1, data: null, message: '请输入邮箱地址' })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.json({ code: 1, data: null, message: '邮箱格式不正确' })
      return
    }

    const ds = getDataSource(req)
    await SubscribeService.subscribe(ds, email.trim().toLowerCase(), name?.trim() || null)
    res.json({ code: 0, data: null, message: '订阅成功！请查收验证邮件' })
  } catch (err: any) {
    const message = err?.message === '该邮箱已订阅' ? '该邮箱已订阅' : '订阅失败，请稍后再试'
    res.json({ code: 1, data: null, message })
  }
})

/**
 * GET /subscribe/verify?token=xxx
 * 验证订阅 → 重定向到前端成功页
 */
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string
    if (!token) {
      res.redirect(`${process.env.SITE_URL || ''}/?subscribe=invalid`)
      return
    }

    const ds = getDataSource(req)
    const ok = await SubscribeService.verify(ds, token)

    if (ok) {
      res.redirect(`${process.env.SITE_URL || ''}/?subscribe=success`)
    } else {
      res.redirect(`${process.env.SITE_URL || ''}/?subscribe=invalid`)
    }
  } catch {
    res.redirect(`${process.env.SITE_URL || ''}/?subscribe=error`)
  }
})

/**
 * GET /subscribe/unsubscribe?token=xxx
 * 退订 → 重定向到前端退订成功页
 */
router.get('/unsubscribe', async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string
    if (!token) {
      res.redirect(`${process.env.SITE_URL || ''}/?subscribe=invalid`)
      return
    }

    const ds = getDataSource(req)
    const ok = await SubscribeService.unsubscribe(ds, token)

    if (ok) {
      res.redirect(`${process.env.SITE_URL || ''}/?subscribe=unsubscribed`)
    } else {
      res.redirect(`${process.env.SITE_URL || ''}/?subscribe=invalid`)
    }
  } catch {
    res.redirect(`${process.env.SITE_URL || ''}/?subscribe=error`)
  }
})

/**
 * GET /subscribe/stats
 * 获取订阅统计（公开接口）
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const ds = getDataSource(req)
    const stats = await SubscribeService.getStats(ds)
    res.json({ code: 0, data: stats, message: 'ok' })
  } catch {
    res.json({ code: 1, data: null, message: '获取统计失败' })
  }
})

export default router
