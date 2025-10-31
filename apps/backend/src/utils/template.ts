import type { Response } from "express"

/**
 * 成功响应模板
 * @param   data	
 * @param   message
 */
export const successTempl = <T = any>(data: T, message: string) => {
	return {
		code: 0,
		data,
		message,
		timestamp: Date.now()
	}
}

/**
 * 失败响应模板
 * @param   message
 * @param   moreMsg
 */
export const failTempl = (message: string, moreMsg = ''):
{
	code: 1,
	data: null,
	message: string,
	timestamp: number
} => {
	return {
		code: 1,
		data: null,
		message: `${message}${moreMsg ? `, ${moreMsg}` : ''}`,
		timestamp: Date.now()
	}
}

/**
 * 分页查询模板
 * @param   data
 * @param   message
 * @param   options
 * @param   options.page
 * @param   options.limit
 * @param   options.total
 */
export const pageTempl = <T = any>(
	data: T, 
	message: string, 
	options: { 
		page: number, 
		limit: number, 
		total: number
	}
) => 
{
	return {
		code: 0,
		data,
		message,
		timestamp: Date.now(),
		...options
	}
}

/**
 * 响应返回模板
 * @param 	res           响应对象
 * @param   code          0: 成功 1: 失败 object: 其他
 * @param   data          返回数据
 * @param   message       返回信息
 */
export const responseTempl = (res: Response, code: 0 | 1 | object, data: any, message: string): void => {
	if (typeof code === 'object') {
		res.json(code)
	} else {
		res.json(code ? failTempl(message) : successTempl(data, message))
	}
}
