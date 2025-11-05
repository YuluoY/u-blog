import { camelCase, capitalize, snakeCase } from '@u-blog/utils'
import type { Request } from 'express'
import { DATABASE } from '@/constants'
import { DataSource } from 'typeorm'
import { failTempl, successTempl } from './template'
import { FailReturn, SuccessReturn } from '@u-blog/types'

/**
 * 获取数据库实例
 */
export const getDataSource = (req: Request): DataSource => req.app.locals[DATABASE]?.getDataSource?.()

/**
 * 断言
 * @param tryData - 尝试数据
 * @param success - 成功消息
 * @param fail - 失败消息
 * @returns - 成功返回值或失败返回值
 * @example
 * ```ts
 * const [err, data] = await tryit<any, Error>(() => RestService.query(req.model))
 * assert([err, data], 'success', 'fail')
 */
export const assert = <T = any, E = Error>(
	tryData: [E, T], 
	success: string,
	fail: string
): SuccessReturn<T> | FailReturn =>
{
	const [err, data] = tryData
	if (err)
	{
		console.error(err)
		return failTempl(fail)
	}
	return successTempl<T>(data, success)
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
export const toModelName = (tableName: string): string => capitalize(camelCase(tableName))

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
export const toTableName = (modelName: string): string => snakeCase(modelName)

/**
 * 返回带类型的值
 * @param {string} str
 * @returns
 */
export const withType = <T = any>(str: string, defaultValue: T): T =>
{
	try {
		return new Function(`return ${str}`)() as T
	} catch (error) {
		return defaultValue
	}
}