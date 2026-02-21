import express, { type Router } from 'express'
import type { Request, Response } from 'express'
import CommonController from '@/controller/common'
import * as SettingsController from '@/controller/settings'
import { UploadHandler } from '@/middleware/UploadHandler'
import { requireAuth } from '@/middleware/AuthGuard'
import { requireRole } from '@/middleware/RoleGuard'
import { toResponse } from '@/utils'
import { IUserLogin, CUserRole } from '@u-blog/model'

const router = express.Router() as Router

router.get('/settings', (req: Request, res: Response) => SettingsController.getSettings(req, res))
router.put('/settings', requireAuth, requireRole(CUserRole.ADMIN), (req: Request, res: Response) => SettingsController.putSettings(req, res))

router.get('/site-overview', async (req: Request, res: Response) => {
  const result = await CommonController.getSiteOverview(req, res)
  toResponse(result, res)
})

router.get('/cloud-weights', async (req: Request, res: Response) => {
  const result = await CommonController.getCloudWeights(req, res)
  toResponse(result, res)
})

router.get('/article-search', async (req: Request, res: Response) => {
  const result = await CommonController.searchArticles(req, res)
  toResponse(result, res)
})

router.post('/register', async (req: Request, res: Response) => {
  const result = await CommonController.register(req, res)
  toResponse(result, res)
})

/** 发送邮箱验证码（注册前调用） */
router.post('/send-email-code', async (req: Request, res: Response) => {
  const result = await CommonController.sendEmailCode(req, res)
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

router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  const result = await CommonController.logout(req, res)
  toResponse(result, res)
})

router.post('/chat', async (req: Request, res: Response) => {
  const result = await CommonController.chat(req, res)
  toResponse(result, res)
})

/* ---------- 文件上传（需要登录） ---------- */
router.post('/upload', requireAuth, UploadHandler('file'), async (req: Request, res: Response) => {
  const result = await CommonController.upload(req, res)
  toResponse(result, res)
})

router.delete('/media', requireAuth, async (req: Request, res: Response) => {
  const result = await CommonController.deleteMedia(req, res)
  toResponse(result, res)
})

/* ---------- 浏览量统计 ---------- */

/** 文章浏览计数（同 IP 10 分钟去重） */
router.post('/article-view', async (req: Request, res: Response) => {
  const result = await CommonController.recordArticleView(req, res)
  toResponse(result, res)
})

/** 站点访问记录（同 IP 每日去重） */
router.post('/site-visit', async (req: Request, res: Response) => {
  const result = await CommonController.recordSiteVisit(req, res)
  toResponse(result, res)
})

export default router