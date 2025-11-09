import type { Request, Response, NextFunction } from 'express'
import { CTable } from '@u-blog/model'
import { isArray, omit } from '@u-blog/utils'

/**
 * 响应拦截器
 * @param req
 * @param res
 * @param next
 */
export const ResponseInterceptor = (req: Request, res: Response, next: NextFunction) => {
	const rawSend = res.send.bind(res)
	res.send = (result) => {
		return rawSend(result)
	}

	next()
}
