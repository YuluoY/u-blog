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
		// 对users的响应数据进行处理
		// if (req.tableName === CTable.USER && result.code === 0) handleUserData(result)

		// 对一般数据处理
		if (result.data?.length) result.data = result.data.map((item) => omit(item, ['deletedAt']))

		return rawSend(result)
	}

	next()
}

/**
 * 对users表中的响应数据处理
 */
function handleUserData(result) {
	const fields = ['password', 'rthash']
	result.data = isArray(result.data) ? result.data.map((item) => omit(item, fields)) : omit(result.data, fields)
}