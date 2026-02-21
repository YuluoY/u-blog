import type { Request, Response, NextFunction } from 'express'
import { AuthGuard } from './AuthGuard'

/**
 * 请求拦截器：解析 JWT 令牌并挂载 req.user（不阻断未登录请求）。
 * 全局中间件，在所有路由之前执行。
 */
export const RequestInterceptor = (req: Request, res: Response, next: NextFunction) => {
	AuthGuard(req, res, next)
}