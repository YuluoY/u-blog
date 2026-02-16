import { FailReturn, PageReturn, SuccessReturn } from "@u-blog/types"

/**
 * 成功响应模板
 * @param   data	
 * @param   message
 * @param   extra
 * @example
 * ```ts
 * const data = { name: 'John', age: 20 }
 * const result = successTempl(data, 'success', 0, { page: 1, limit: 10, total: 100 })
 * ```
 */
export const successTempl = <T = any>(
	data: T, 
	message: string, 
	code: number = 0,
	extra?: Pick<PageReturn<T>, 'page' | 'limit' | 'total'>
): SuccessReturn<T> | PageReturn<T> =>
{
	return {
		code: code as 0,
		data,
		message,
		timestamp: Date.now(),
		...extra
	} as SuccessReturn<T> | PageReturn<T>
}

/**
 * 失败响应模板
 * @param   message
 * @param   moreMsg
 * @example
 * ```ts
 * const result = failTempl('error')
 * const result = failTempl('error', 400)
 * ```
 */
export const failTempl = (message: string, code: number = 1): FailReturn => {
	return {
		code: code as 1,
		data: null,
		message,
		timestamp: Date.now()
	}
}
