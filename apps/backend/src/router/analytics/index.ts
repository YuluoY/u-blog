import express, { type Router, type Request, type Response } from 'express'
import rateLimit from 'express-rate-limit'
import { AuthGuard, requireAuth } from '@/middleware/AuthGuard'
import { requireRole } from '@/middleware/RoleGuard'
import { CUserRole } from '@u-blog/model'
import AnalyticsService from '@/service/analytics'

const router = express.Router() as Router

const _isDev = process.env.NODE_ENV !== 'production'

/** 开发环境跳过 localhost 限流 */
function skipLocalhost(req: Request): boolean {
  if (!_isDev) return false
  const ip = req.ip || req.socket?.remoteAddress || ''
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'
}

/** 追踪接口限流：同一 IP 每分钟最多 60 次 */
const trackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, data: null, message: '上报过于频繁' },
  validate: { trustProxy: false },
  skip: skipLocalhost,
})

/** 管理员权限中间件（admin 级别即可） */
const adminOnly = requireRole(CUserRole.ADMIN)

/**
 * POST /activity/track — 公开接口，前端上报行为事件
 * Body: { events: IActivityLogDto[] } 或单条 IActivityLogDto
 */
router.post('/track', trackLimiter, AuthGuard, async (req: Request, res: Response) => {
  try {
    const svc = await AnalyticsService.fromRequest(req)
    const body = req.body

    if (Array.isArray(body.events)) {
      await svc.trackBatch(req, body.events)
    } else if (body.type) {
      await svc.track(req, body)
    } else {
      return res.json({ code: 1, data: null, message: '缺少事件数据' })
    }

    return res.json({ code: 0, data: null, message: 'ok' })
  } catch (err: any) {
    console.error('[Analytics] track error:', err)
    return res.json({ code: 1, data: null, message: err.message || '事件上报失败' })
  }
})

/* ---------- 以下接口仅管理员可访问 ---------- */

/** GET /activity/stats/overview — 总览 */
router.get('/stats/overview', requireAuth, adminOnly, async (req: Request, res: Response) => {
  try {
    const svc = await AnalyticsService.fromRequest(req)
    const data = await svc.getOverview()
    return res.json({ code: 0, data, message: 'ok' })
  } catch (err: any) {
    return res.json({ code: 1, data: null, message: err.message })
  }
})

/** GET /activity/stats/trends?days=30 — PV/UV 趋势 */
router.get('/stats/trends', requireAuth, adminOnly, async (req: Request, res: Response) => {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 30, 365)
    const svc = await AnalyticsService.fromRequest(req)
    const data = await svc.getTrends(days)
    return res.json({ code: 0, data, message: 'ok' })
  } catch (err: any) {
    return res.json({ code: 1, data: null, message: err.message })
  }
})

/** GET /activity/stats/pages?limit=20 — 页面排行 */
router.get('/stats/pages', requireAuth, adminOnly, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
    const svc = await AnalyticsService.fromRequest(req)
    const data = await svc.getPageRanks(limit)
    return res.json({ code: 0, data, message: 'ok' })
  } catch (err: any) {
    return res.json({ code: 1, data: null, message: err.message })
  }
})

/** GET /activity/stats/geo?limit=20 — 地域分布 */
router.get('/stats/geo', requireAuth, adminOnly, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)
    const svc = await AnalyticsService.fromRequest(req)
    const data = await svc.getGeoDistribution(limit)
    return res.json({ code: 0, data, message: 'ok' })
  } catch (err: any) {
    return res.json({ code: 1, data: null, message: err.message })
  }
})

/** GET /activity/stats/devices — 设备/浏览器/OS 分布 */
router.get('/stats/devices', requireAuth, adminOnly, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 30)
    const svc = await AnalyticsService.fromRequest(req)
    const [browsers, devices, os] = await Promise.all([
      svc.getBrowserDistribution(limit),
      svc.getDeviceDistribution(limit),
      svc.getOsDistribution(limit),
    ])
    return res.json({ code: 0, data: { browsers, devices, os }, message: 'ok' })
  } catch (err: any) {
    return res.json({ code: 1, data: null, message: err.message })
  }
})

/** GET /activity/logs — 日志列表（分页 + 筛选） */
router.get('/logs', requireAuth, adminOnly, async (req: Request, res: Response) => {
  try {
    const svc = await AnalyticsService.fromRequest(req)
    const data = await svc.getLogs({
      page: parseInt(req.query.page as string) || 1,
      pageSize: Math.min(parseInt(req.query.pageSize as string) || 20, 100),
      type: (req.query.type as string) || undefined,
      ip: (req.query.ip as string) || undefined,
      path: (req.query.path as string) || undefined,
      userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
      startDate: (req.query.startDate as string) || undefined,
      endDate: (req.query.endDate as string) || undefined,
    })
    return res.json({ code: 0, data, message: 'ok' })
  } catch (err: any) {
    return res.json({ code: 1, data: null, message: err.message })
  }
})

export default router
