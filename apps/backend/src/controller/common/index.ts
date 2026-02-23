import type { Request, Response } from 'express'
import type { ControllerReturn } from '@u-blog/types'
import { tryit } from '@u-blog/utils'
import { formatResponse, getClientIp, getDataSource } from '@/utils'
import CommonService, { type SearchScope } from '@/service/common'
import { Users } from '@/module/schema/Users'
import { Repository } from 'typeorm'
import { IUserLogin } from '@u-blog/model'
import appCfg from '@/app'

class CommonController {
  /** 发送邮箱验证码 */
  async sendEmailCode(req: Request, _res: Response): ControllerReturn
  {
    const { email } = req.body || {}
    const userRepo = getDataSource(req).getRepository(Users) as Repository<Users>
    const tryData = await tryit<any, Error>(() => CommonService.sendEmailCode(req, email, userRepo))
    return formatResponse(tryData, '验证码已发送', '发送验证码失败')
  }

  async register(req: Request, res: Response): ControllerReturn
  {
    const { ret = 0, ...data } = req.body
    const userRepo = getDataSource(req).getRepository(Users) as Repository<Users>
    const tryData = await tryit<any, Error>(() => CommonService.register(req, userRepo, data, Number(ret)))
    if (tryData[1])
      this.setCookie(res, tryData[1])
    return formatResponse(tryData, req.__('common.registerSuccess'), req.__('common.registerFail'))
  }

  async login<T = IUserLogin>(req: Request, res: Response): ControllerReturn<T>
  {
    const { username, password } = req.body
    const userRepo = getDataSource(req).getRepository(Users) as Repository<Users>
    const tryData = await tryit<any, Error>(() => CommonService.login(req, userRepo, { username, password }))
    if (tryData[1])
      this.setCookie(res, tryData[1])
    return formatResponse(tryData, req.__('common.loginSuccess'), req.__('common.loginFail'))
  }

  async refreshToken(req: Request, res: Response): ControllerReturn
  {
    const userRepo = getDataSource(req).getRepository(Users) as Repository<Users>
    const tryData = await tryit<any, Error>(() => CommonService.refreshToken(req, userRepo))
    if (tryData[1])
      this.setCookie(res, tryData[1])
    return formatResponse(tryData, req.__('common.refreshTokenSuccess'), req.__('common.refreshTokenFail'), undefined, { skipErrorLog: true })
  }

  /** 登出：清除服务端令牌 + 删除 rt cookie */
  async logout(req: Request, res: Response): ControllerReturn
  {
    const userRepo = getDataSource(req).getRepository(Users) as Repository<Users>
    const tryData = await tryit<any, Error>(() => CommonService.logout(req, userRepo))
    // 无论数据库操作是否成功都清除 cookie
    res.clearCookie('rt', { httpOnly: true, path: '/', sameSite: 'lax' })
    return formatResponse(tryData, '登出成功', '登出失败')
  }

  /** 网站概览统计（文章/分类/标签数、浏览/点赞/评论、运行天数、最后更新） */
  async getSiteOverview(req: Request, _res: Response): ControllerReturn
  {
    const tryData = await tryit(() => CommonService.getSiteOverview(req))
    return formatResponse(tryData, 'ok', '获取网站概览失败')
  }

  /** 类别/标签权重与声噪，供前端词云等可视化 */
  async getCloudWeights(req: Request, _res: Response): ControllerReturn
  {
    const tryData = await tryit(() => CommonService.getCloudWeights(req))
    return formatResponse(tryData, 'ok', '获取词云权重失败')
  }

  /** 文章全文搜索：对标题、正文、描述 ILIKE 匹配，仅已发布，返回列表与片段 */
  async searchArticles(req: Request, _res: Response): ControllerReturn
  {
    const keyword = (req.query.keyword ?? req.body?.keyword ?? '') as string
    const scope = (req.query.scope ?? req.body?.scope ?? 'all') as SearchScope
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? req.body?.limit ?? 20) || 20))
    const tryData = await tryit(() => CommonService.searchArticles(req, keyword, scope, limit))
    return formatResponse(tryData, 'ok', '搜索失败')
  }

  /** 文件上传：multer 处理后交由 Service 写入 Media 表 */
  async upload(req: Request, _res: Response): ControllerReturn
  {
    const tryData = await tryit<any, Error>(() => CommonService.upload(req))
    return formatResponse(tryData, '上传成功', '上传失败')
  }

  /** 删除媒体文件（Media 记录 + 物理文件） */
  async deleteMedia(req: Request, _res: Response): ControllerReturn
  {
    const id = Number(req.body?.id ?? req.query?.id)
    if (!id || Number.isNaN(id)) {
      return formatResponse([new Error('id 必填') as any, null], '删除成功', '删除失败')
    }
    const tryData = await tryit<void, Error>(() => CommonService.deleteMedia(req, id))
    return formatResponse(tryData, '删除成功', '删除失败')
  }

  /** 记录文章浏览（viewCount +1 + View 日志） */
  async recordArticleView(req: Request, _res: Response): ControllerReturn
  {
    const articleId = Number(req.body?.articleId)
    if (!articleId || Number.isNaN(articleId)) {
      return formatResponse([new Error('articleId 必填') as any, null], 'ok', '参数错误')
    }
    const ip = getClientIp(req)
    const agent = req.get('User-Agent') ?? undefined
    const tryData = await tryit<any, Error>(() => CommonService.recordArticleView(req, articleId, ip, agent))
    return formatResponse(tryData, 'ok', '记录浏览失败')
  }

  /** 记录站点访问（按 IP 去重，每日 UV） */
  async recordSiteVisit(req: Request, _res: Response): ControllerReturn
  {
    const ip = getClientIp(req)
    const agent = req.get('User-Agent') ?? undefined
    const tryData = await tryit<any, Error>(() => CommonService.recordSiteVisit(req, ip, agent))
    return formatResponse(tryData, 'ok', '记录访问失败')
  }

  /** 文章点赞切换（登录用户 DB 去重 / 游客 IP+fingerprint 去重） */
  async toggleArticleLike(req: Request, _res: Response): ControllerReturn
  {
    const articleId = Number(req.body?.articleId)
    if (!articleId || Number.isNaN(articleId)) {
      return formatResponse([new Error('articleId 必填') as any, null], 'ok', '参数错误')
    }
    const ip = getClientIp(req)
    const fingerprint = (req.body?.fingerprint as string) ?? undefined
    const tryData = await tryit<any, Error>(() => CommonService.toggleArticleLike(req, articleId, ip, fingerprint))
    return formatResponse(tryData, 'ok', '操作失败')
  }

  /** 查询文章点赞状态 */
  async getArticleLikeStatus(req: Request, _res: Response): ControllerReturn
  {
    const articleId = Number(req.query?.articleId ?? req.body?.articleId)
    if (!articleId || Number.isNaN(articleId)) {
      return formatResponse([new Error('articleId 必填') as any, null], 'ok', '参数错误')
    }
    const ip = getClientIp(req)
    const fingerprint = (req.query?.fingerprint as string) ?? undefined
    const tryData = await tryit<any, Error>(() => CommonService.getArticleLikeStatus(req, articleId, ip, fingerprint))
    return formatResponse(tryData, 'ok', '查询失败')
  }

  /** 更新当前用户个人资料（仅允许编辑安全字段） */
  async updateProfile(req: Request, _res: Response): ControllerReturn
  {
    const userId = req.user?.id
    if (!userId) {
      return formatResponse([new Error('未登录') as any, null], '更新成功', '未登录')
    }
    const userRepo = getDataSource(req).getRepository(Users) as Repository<Users>
    // 白名单：仅允许修改的字段
    const ALLOWED_FIELDS = ['namec', 'avatar', 'bio', 'gender', 'birthday', 'location', 'website', 'socials'] as const
    const updates: Record<string, unknown> = {}
    for (const field of ALLOWED_FIELDS) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field]
      }
    }
    if (Object.keys(updates).length === 0) {
      return formatResponse([new Error('没有可更新的字段') as any, null], '更新成功', '没有可更新的字段')
    }
    const tryData = await tryit<any, Error>(async () => {
      await userRepo.update(userId, updates)
      // 返回更新后的用户（排除敏感字段）
      const user = await userRepo.findOne({
        where: { id: userId },
        select: ['id', 'username', 'email', 'namec', 'avatar', 'bio', 'role', 'gender', 'birthday', 'location', 'website', 'socials'],
      })
      return user
    })
    return formatResponse(tryData, '更新成功', '更新个人资料失败')
  }

  private setCookie(res: Response, data: any): void
  {
    if (data?.rt)
    {
      res.cookie('rt', data.rt, appCfg.plugins.cookie)
      delete data.rt
    }
  }
}

export default new CommonController()