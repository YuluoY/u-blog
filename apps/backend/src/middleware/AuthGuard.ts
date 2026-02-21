import type { Request, Response, NextFunction } from 'express'
import { verify } from '@/plugin/jwt'
import type { JwtUser } from '@/types/express'

/**
 * 从请求头 Authorization: Bearer <token> 中提取 JWT 并验证。
 * 验证通过后将 payload 挂载到 req.user；未携带或无效时不阻断，
 * 仅保持 req.user 为 undefined，由后续 requireAuth / requireRole 决定是否拒绝。
 */
export const AuthGuard = (req: Request, _res: Response, next: NextFunction) => {
	const header = req.headers.authorization
	if (header?.startsWith('Bearer ')) {
		const token = header.slice(7)
		const result = verify<JwtUser>(token)
		if (result.valid && result.data) {
			req.user = {
				id: result.data.id,
				username: result.data.username,
				role: result.data.role,
			}
		}
	}
	next()
}

/**
 * 要求已认证：req.user 不存在时返回 401。
 * 用法：router.post('/xxx', requireAuth, handler)
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
	if (!req.user) {
		res.status(401).json({ code: 401, data: null, message: '请先登录' })
		return
	}
	next()
}
