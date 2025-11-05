import type { Request, Response, NextFunction } from 'express'
import { toModelName, getDataSource } from '@/utils'

/**
 * 处理model表实例中间件
 * @param req
 * @param req
 * @param next
 */
export const ModelHandler = (req: Request, res: Response, next: NextFunction) => {
	const { model } = req.params
	const database = getDataSource(req)
	req.model = database.getRepository(toModelName(model))
	next()
}
