import { camelCase, capitalize, isFunction, snakeCase, tryit } from '@u-blog/utils'
import { failTempl, successTempl } from '@/utils/template'
import type { Response, Request } from 'express'
import { DATABASE } from '@/constants'
import { DataSource } from 'typeorm'

/**
 * 获取数据库实例
 */
export const getDatabase = (req: Request): DataSource => req.app.locals[DATABASE]

/**
 * 返回响应模板
 * @param 	{import('express').Response} res
 * @param 	{Function} fn
 * @param 	{Object} opts
 * @param 	{Function} opts.handleData
 * @param 	{string} opts.success
 * @param 	{string} opts.error
 * @param 	{number} opts.statusCode
 * @param   {any[]} [opts.fnArgs=[]]
 * @return 	{Promise<{code: number, data: any, message: string, timestamp: number}>}
 * @example
 * ```js
 * const templ = await toRespTempl(res, async (data) => data, {...})
 * ```
 */
export const toRespTempl = async <T>(
	res: Response, 
	fn: () => T, 
	opts: { 
		fnArgs?: any[], 
		statusCode?: number, 
		handleData?: (data: any) => any, success?: string, error?: string } = {}
	) => 
{
	let [err, data] = await tryit(fn, { fnArgs: opts.fnArgs || [] })

	try {
		if (opts.statusCode) res.status(opts.statusCode)
		if (err) throw new Error(err.message)

		if (isFunction(opts.handleData)) data = await opts.handleData(data)
		if (data === false) throw new Error()

		return res.send(successTempl(data, opts.success ? res.__(opts.success) : '请求成功！'))
	} catch (error) {
		console.log(error)
		return res.send(failTempl(opts.error ? res.__(opts.error) : '请求失败！'))
	}
}

/**
 * 将表名称转换为模型名称
 * @param 	{string} tableName
 * @returns 	{string}
 * @example
 * ```js
 * const Users = toModelName('users') // Users
 * const ArticleTag = toModelName('article_tag') // ArticleTag
 * ```
 */
export const toModelName = (tableName: string) => {
	return capitalize(camelCase(tableName))
}

/**
 * 将模型名称转换为表名称
 * @param 	{string} modelName
 * @returns 	{string}
 * @example
 * ```js
 * const users = toTableName('Users') // users
 * const articleTag = toTableName('ArticleTag') // article_tag
 * ```
 */
export const toTableName = (modelName: string) => {
	return snakeCase(modelName)
}

/**
 * 返回带类型的值
 * @param {string} str
 * @returns
 */
export const withType = (str: string) => {
	return new Function(`return ${str}`)()
}