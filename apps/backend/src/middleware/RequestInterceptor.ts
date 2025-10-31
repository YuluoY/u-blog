import type { Request, Response, NextFunction } from 'express'

/**
 * 请求拦截器
 * @param req
 * @param res
 * @param next
 */
export const RequestInterceptor = (req: Request, res: Response, next: NextFunction) => {
	next()
}