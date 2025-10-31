const fs = require('node:fs')
const path = require('node:path')
const BaseType = require('./logic/BaseType')
const { USER_ROLE, CUSTOM_TYPE, TYPE, ARTICLE_STATUS } = require('./constants')
const _ = require('lodash')

async function loadSchema(client, opts = {}) {
	const { logger = false } = opts
	const result = {}
	const allModelInit = []
	const allModelName = []
	// 读取到schema下的所有js文件
	fs.readdirSync(path.join(__dirname, './schema')).forEach(async (file) => {
		const ext = path.extname(file)
		const name = path.basename(file, ext)
		if (ext === '.js') {
			const Schema = require(path.join(__dirname, './schema', file))
			try {
				const instance = new Schema(client)
				result[name] = instance
				allModelInit.push(() => instance.init())
				allModelName.push(name)
			} catch (error) {
				console.log(name, error)
			}
		}
	})
	executeAsyncWithRetryQueue(allModelInit, { maxAttempts: 2, delayTime: 100, name: allModelName, logger })
	return result
}

/**
 * 加载自定义类型
 * @param {Client} client
 */
async function loadCustomTypes(client) {
	const tool = new BaseType(client)

	await tool.isExistType(CUSTOM_TYPE.USER_ROLE, { isDel: true, isCascade: true })
	await tool.createType(TYPE.ENUM, CUSTOM_TYPE.USER_ROLE, Object.values(USER_ROLE))

	await tool.isExistType(CUSTOM_TYPE.ARTICLE_STATUS, { isDel: true, isCascade: true })
	await tool.createType(TYPE.ENUM, CUSTOM_TYPE.ARTICLE_STATUS, Object.values(ARTICLE_STATUS))
}

/**
 * 加载sql函数
 * @param {Client} client
 */
async function loadFuncs(client) {}

/**
 * 加载触发器函数
 * @param {Client} client
 */
async function loadTriggerFuncs(client) {}

module.exports = async (client, opts) => {
	await loadCustomTypes(client)
	await loadFuncs(client)
	await loadTriggerFuncs(client)
	return loadSchema(client, opts)
}

/**
 * 异步执行函数并处理重试逻辑
 * @param 		{Function|Array<Function>} 				func 													- 要执行的单个异步函数或异步函数数组
 * @param 		{object} 													[opts={}] 										- 可选参数对象
 * @param 		{string|Array<string>} 						[opts.name='function'] 				- 函数名称，默认为 'function'，可以为数组
 * @param 		{number} 													[opts.maxAttempts=2] 					- 最大尝试次数，默认为 2 次
 * @param 		{number} 													[opts.delayTime=1000] 				- 延迟时间（毫秒），默认为 1000 毫秒
 * @param 		{boolean} 												[opts.logger=false] 					- 是否打印日志，默认为 false
 */
function executeAsyncWithRetryQueue(func, opts = {}) {
	const { name = 'function', maxAttempts = 2, delayTime = 1000, logger = false } = opts
	const retryQueue = []
	const attemptLogs = [] // 存储每次尝试的日志

	// 检查是否是数组，如果是单个函数则转换成数组
	const funcArray = Array.isArray(func) ? func : [func]
	// 检查是否是数组，如果是单个名称则转换成数组
	const nameArray = Array.isArray(name) ? name : new Array(funcArray.length).fill(name)

	// 格式化日志记录
	const formatLog = (tableName, message, status) => {
		const timestamp = new Date().toLocaleString()
		return { timestamp, tableName, message, status }
	}

	// 异步执行函数并处理重试逻辑
	const tryExecute = async (func, tableName, attempts = 0) => {
		const logBuffer = [] // 当前尝试的日志
		try {
			await func() // 执行异步函数并等待完成
			logBuffer.push(formatLog(tableName, `The ${tableName} executed successfully!`, '✅ Success'))
		} catch (error) {
			attempts += 1
			logBuffer.push(
				formatLog(tableName, `The ${tableName} encountered an error. Retrying... (Attempt ${attempts})`, '⚠️ Retrying')
			)

			if (attempts < maxAttempts) {
				// 推迟重试并放入队列
				retryQueue.push(() => _.defer(() => tryExecute(func, tableName, attempts)))
			} else {
				logBuffer.push(formatLog(tableName, `The ${tableName} max attempts reached. Throwing error.`, '❌ Failed'))
			}
		} finally {
			// 存储每次尝试的日志
			attemptLogs.push(logBuffer)
		}
	}

	// 对每个函数进行首次执行
	funcArray.forEach((fn, index) => tryExecute(fn, nameArray[index]))

	// 处理重试队列，并在所有操作完成后聚合打印
	_.delay(async () => {
		while (retryQueue.length) {
			const retry = retryQueue.shift() // 从队列中取出重试操作
			await retry() // 等待重试执行完毕

			// 每次重试完成后打印当前日志（仅打印失败的）
			const currentLog = attemptLogs[attemptLogs.length - 1] // 取出最后一组日志
			const failedLogs = currentLog.filter((log) => log.status === '⚠️ Retrying' || log.status === '❌ Failed') // 只保留重试和失败的日志

			if (failedLogs.length > 0) {
				logger && console.table(failedLogs) // 打印当前尝试日志
			}
		}

		// 所有重试完成后，统一打印最终日志
		const finalLog = attemptLogs.flat() // 扁平化最终日志
		logger && console.table(finalLog) // 打印最终执行日志
	}, delayTime) // 设置延迟时间
}
