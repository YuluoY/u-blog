import type { Request, Response, NextFunction } from 'express'
// import { getModel, toModelName, toTableName } from '@/utils'

/**
 * 处理model表实例中间件
 * @param req
 * @param req
 * @param next
 */
export const ModelHandler = (req: Request, res: Response, next: NextFunction) => {
	// const { model } = req.params
	// req.model = model ? getModel(req, toModelName(model)) : null
	// req.tableName = toTableName(model)
	next()
}
