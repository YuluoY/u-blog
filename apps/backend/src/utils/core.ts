import { snakeCase } from '@u-blog/utils'
import type { CookieOptions, Request, Response } from 'express'
import { DATABASE } from '@/constants'
import { DataSource } from 'typeorm'
import { failTempl, successTempl } from './template'
import { FailReturn, SuccessReturn } from '@u-blog/types'

/**
 * 获取数据库实例
 */
export const getDataSource = (req: Request): DataSource => req.app.locals[DATABASE]?.getDataSource?.()

/**
 * 存储响应cookie
 * @param res - 响应
 * @param key - 键
 * @param value - 值
 * @param options - 选项
 */
export const setResponseCookie = (res: Response, key: string, value: string, options: CookieOptions): void => {
	res.cookie(key, value, options)
}

/**
 * 返回处理结果
 * @param data - 数据
 * @param res - 响应
 * @returns
 */
export const toResponse = (data: any, res: Response): any => {
	if (data.code !== 0 && data.code !== 1)
		return res.status(data.code).json(data)
	return res.json(data)
}

/**
 * 格式化响应数据
 * @param tryData - 尝试数据
 * @param success - 成功消息
 * @param fail - 失败消息
 * @returns - 成功返回值或失败返回值
 * @example
 * ```ts
 * const [err, data] = await tryit<any, Error>(() => RestService.query(req.model))
 * formatResponse([err, data], 'success', 'fail', 0)
 */
export interface FormatResponseOptions {
	/** 为 true 时不打印错误栈（用于预期业务失败，如未登录） */
	skipErrorLog?: boolean
}

export const formatResponse = <T = any, E extends Error = Error>(
	tryData: [E, T], 
	success: string,
	fail: string,
	code?: number,
	opts?: FormatResponseOptions
): SuccessReturn<T> | FailReturn =>
{
	const [err, data] = tryData
	if (err)
	{
		if (!opts?.skipErrorLog) console.error(err)
		return failTempl(err.message ?  `${fail}, ${err.message}` : fail, code || 1)
	}
	return successTempl<T>(data, success, code || 0)
}

/**
 * 将表名称（snake_case）转换为 TypeORM 实体名（PascalCase）
 * @param 	{string} tableName
 * @returns 	{string}
 * @example
 * ```js
 * toModelName('users') // Users
 * toModelName('article_tag') // ArticleTag
 * toModelName('page_block') // PageBlock
 * ```
 */
export const toModelName = (tableName: string): string =>
  tableName
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('')

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

/**
 * 格式化 class-validator 验证错误
 * @param errors - 验证错误数组（来自 validate 函数）
 * @returns 格式化后的错误信息字符串，格式：字段名: 错误信息; 字段名: 错误信息
 * @example
 * ```ts
 * const errors = await validate(plainToInstance(Users, data))
 * if (errors.length > 0) {
 *   throw new Error(formatValidationErrors(errors))
 * }
 * // 输出示例: "email: 邮箱格式不正确; password: 密码长度必须在6-20之间"
 * ```
 */
export const formatValidationErrors = (errors: any[]): string => {
	return errors
		.map(error => {
			const field = error.property
			const messages = error.constraints 
				? Object.values(error.constraints).join(',') 
				: '验证失败'
			return `${field}: ${messages}`
		})
		.join('; ')
}