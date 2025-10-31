/**
 * sql工具类
 * @date 2024-07-21
 * @author Yuluo
 */

const { isEmpty, isArray, isPlainObject, isFunction, isString } = require('lodash')

/**
 * 类型定义
 *
 * @typedef {'query' | 'update' | 'remove' | 'insert'} OperType
 *
 * @typedef {'AND' | 'OR' | 'NOT'} ConnectType
 * @typedef 		{object}								Collection
 * @property 		{Query} 								query							查询
 * @property 		{Update} 								update						更新
 * @property 		{Remove} 								remove						删除
 * @property 		{Insert} 								insert						插入
 *
 * @typedef 		{object} 								History
 * @property 		{string} 								tableName					表名称
 * @property 		{Collection}						collection				收集的数据
 * @property 		{OperType} 							operationType			操作类型
 * @property 		{string} 								sql								sql字符串
 *
 * @typedef 		{object} 								Query
 * @property 		{string | string[]} 		cols							列数
 * @property 		{Array<[]>} 						where							条件
 * @property 		{Array<number>} 				whereOrder				条件执行顺序
 * @property 		{string} 								orderBy						数据排序
 * @property 		{string} 								groupBy						数据分组
 * @property 		{number | string} 			limit							条数限制
 * @property 		{number | string} 			offset						条数偏移
 *
 * @typedef 		{object} 								Update
 * @property 		{object} 								newValue					更新的新对象
 * @property 		{Array<[]>} 						where							条件
 *
 * @typedef 		{object} 								Remove
 * @property 		{boolean} 							[isAll=false]			是否删除所有数据
 * @property    {boolean}								[isBack=false]		是否返回删除的数据
 * @property 		{Array<[]>} 						where							条件
 *
 * @typedef 		{object} 								Insert
 * @property 		{object | object[]} 		newValue					插入的对象
 * @property 		{boolean} 							[isBack=false]		是否返回插入的数据
 */

class SqlTools {
	_tableName = null
	_operation = null
	_tableNames = []
	_history = []
	TrimTabAndCRRegex = /\t|\n/g
	PlaceholderRegex = /\?/g

	collection = {
		query: {
			cols: '*',
			where: [],
			whereOrder: [],
			orderBy: null,
			groupBy: null,
			limit: null,
			offset: null
		},
		update: {
			newValue: {},
			where: []
		},
		remove: {
			isAll: false,
			isBack: false,
			where: []
		},
		insert: {
			newValue: null,
			isBack: false
		}
	}

	/**
	 *
	 * @param {object} opts
	 * @param {string} opts.tableName
	 */
	constructor(opts = {}) {
		this.tableName = opts.tableName || null
	}

	/**
	 * @param 		{string} 		tableName  		表名称
	 * @returns 	{SqlTools}
	 */
	setTable(tableName) {
		this.tableName = tableName
		return this
	}

	/**
	 * 查询
	 * @param 		{string | Array=} 	cols 					列名，默认为 *
	 * @returns		{SqlTools}
	 * ```js
	 * query(['id', 'name']).where([['id', '=', 1]])
	 * query('id,name').where([['id', '=', 1]])
	 * query().where([['id', '=', 1]])
	 * ```
	 */
	query(cols = '*') {
		this._preAction(this.query.name)
		this.collection.query.cols = cols
		return this
	}

	/**
	 * 更新
	 * @param 		{object} 			obj				 						更新的键值对对象
	 * @param 		{object} 			opts				 					配置项
	 * @param 		{boolean} 		[opts.isBack=false] 	是否返回更新后的数据
	 * @returns 	{SqlTools}
	 * ```js
	 * update({name: 'test', age: 18}).where([['id', '=', 1]])
	 * ```
	 */
	update(obj, opts = {}) {
		if (!isPlainObject(obj) || isEmpty(obj)) {
			throw new Error('update obj is empty or not an object')
		}
		const { isBack = false } = opts
		this._preAction(this.update.name)
		this.collection.update.newValue = obj
		this.collection.update.isBack = isBack
		return this
	}

	/**
	 * 删除
	 * @param     {object}			opts          				配置项
	 * @param 		{boolean} 		[opts.isAll=false] 	  是否删除所有
	 * @param 		{boolean} 		[opts.isBack=false] 	是否返回删除的数据
	 * @returns 	{SqlTools}
	 * ```js
	 * remove({ isAll: true })
	 * remove().where([['id', '=', 1]])
	 * ```
	 */
	remove(opts = {}) {
		const { isAll = false, isBack = false } = opts
		this._preAction(this.remove.name)
		this.collection.remove.isAll = isAll
		this.collection.remove.isBack = isBack
		return this
	}

	/**
	 * 插入
	 * @param 			{object | Array} 			obj					 							插入的对象数据
	 * @param 			{object}              [opts={}]          				配置项
	 * @param       {boolean}             [opts.isBack=false]     	是否返回插入的数据
	 * @returns 		{SqlTools}
	 * @example
	 * ```js
	 * insert({name: 'test', age: 18}, { isBack: true })
	 * insert([{name: 'test', age: 18}, {name: 'test2', age: 19}])
	 * ```
	 */
	insert(obj, opts = {}) {
		const { isBack = false } = opts
		this._preAction(this.insert.name)
		this.collection.insert.newValue = obj
		this.collection.insert.isBack = isBack
		return this
	}

	/**
	 * 条件
	 * @param 		{Array<[]>} 			val
	 * @returns 	{SqlTools}
	 */
	where(val, order = []) {
		this.collection[this.operation].where = val
		this.collection[this.operation].whereOrder = order
		return this
	}

	/**
	 * 分组
	 * @param 		{any} 			val
	 * @returns		{SqlTools}
	 */
	groupBy(val) {
		this.collection[this.operation].groupBy = val
		return this
	}

	/**
	 * 排序
	 * @param 		{any} 			val
	 * @returns		{SqlTools}
	 */
	orderBy(val) {
		this.collection[this.operation].orderBy = val
		return this
	}

	/**
	 * 限制
	 * @param 		{any} 			val
	 * @returns		{SqlTools}
	 */
	limit(val) {
		this.collection[this.operation].limit = val
		return this
	}

	/**
	 * 跳过
	 * @param 		{any} 			val
	 * @returns		{SqlTools}
	 */
	offset(val) {
		this.collection[this.operation].offset = val
		return this
	}

	/**
	 * 格式化sql字符串
	 * @param 		{string} 		sqlStr		sql字符串，?占位
	 * @param 		{Array} 		args 			参数
	 * @returns 	{string}
	 * @example
	 * ```js
	 * format('select * from table where id = ?', [1])
	 * format('select * from table where id in (?)', [[1, 2, 3]])
	 * ```
	 */
	format(sqlStr, args) {
		return sqlStr.replace(this.PlaceholderRegex, () => {
			const item = args.shift()
			const str = this.escape(item)
			if (isArray(item)) {
				return `(${str})`
			}
			return str
		})
	}

	/**
	 * 转换成数据库可用格式/类型
	 * @param 		{any} 		val
	 * @returns 	{string}
	 */
	escape(val) {
		switch (this._getType(val)) {
			case 'string':
				return `'${val}'`
			case 'number':
			case 'float':
				return val + ''
			case 'null':
				return 'null'
			case 'array':
				return val.map((item) => this.escape(item)).join(',')
			case 'object':
				return Object.keys(val)
					.map((key) => `"${key}"=${this.escape(val[key])}`)
					.join(',')
			case 'function':
				return this.escape(val())
			case 'date':
				return `'${val.toISOString()}'`
			case 'buffer':
				return `'${val.toString('base64')}'`
			default:
				return val
		}
	}

	/**
	 * 还原类型
	 * @param 		{string} 		val			值
	 * @param 		{any} 		type			类型
	 * @returns 	{any}
	 */
	unescape(val, type = String) {
		switch (this._getType(type)) {
			case 'string':
				return val
			case 'number':
			case 'float':
				return +val
			case 'null':
				return null
			case 'array':
				return val.startsWith('(') && val.endsWith(')') ? val.slice(1, -1).split(',') : val.split(',')
			case 'object':
				return val.split(',').reduce((acc, next) => {
					const [key, value] = next.split('=')
					acc[key] = this.raw(type, value)
					return acc
				}, {})
			case 'function':
				return () => val
			case 'date':
				return new Date(val)
			default:
				return val
		}
	}

	/**
	 * 将收集的操作，解析成sql字符串
	 * @returns {string}
	 */
	toSqlString() {
		let sql = ''
		const fn = this[this.operation + 'String']
		if (isFunction(fn)) {
			sql = fn.call(this)
		} else {
			throw new Error('operation is not support')
		}
		sql = sql.trim().replace(this.TrimTabAndCRRegex, '')
		this.history = { tableName: this.tableName, collection: this.collection, operation: this.operation, sql }
		console.log('EXECATE: ' + sql)
		return sql
	}

	/**
	 * 处理查询sql
	 * @returns {string}
	 */
	queryString() {
		/** @type {Query} */
		const { cols = '*', where, orderBy, groupBy, limit, offset } = this.collection.query

		let baseSql = `SELECT ${isString(cols) ? cols : cols.join(',')} FROM ${this.tableName}`

		const whereSql = where?.length ? ` WHERE ${this._parseWhere(where)}` : ''
		const groupBySql = groupBy ? ` GROUP BY ${groupBy}` : ''
		const orderBySql = orderBy ? ` ORDER BY ${orderBy}` : ''
		const limitSql = limit ? ` LIMIT ${limit}` : ''
		const offsetSql = offset ? ` OFFSET ${offset}` : ''
		let totalSql = ''

		if (limitSql) {
			totalSql = `WITH total AS ( SELECT COUNT(*) as total FROM ${this.tableName}${whereSql} ) `
			baseSql += ', total'
		}

		let sql = `${totalSql}${baseSql}${whereSql}${groupBySql}${orderBySql}${limitSql}${offsetSql}`

		return sql
	}

	/**
	 * 处理插入sql
	 * @returns {string}
	 */
	insertString() {
		/** @type {Insert} */
		const { newValue, isBack } = this.collection.insert

		let sql = ''

		if (isEmpty(newValue)) {
			throw new Error('Insert value cannot be empty')
		}

		// 处理value为对象或数组的数据使用json
		const escapeValue = (v) => (typeof v === 'object' ? `'${JSON.stringify(v)}'` : this.escape(v))

		const toInsertSql = (o) => {
			const columns = Object.keys(o)
				.map((k) => `"${k}"`)
				.join(',')
			const values = Object.values(o).map(escapeValue).join(',')
			return `INSERT INTO ${this.tableName} (${columns}) VALUES (${values})`
		}

		if (isPlainObject(newValue)) {
			sql = toInsertSql(newValue)
		} else if (isArray(newValue)) {
			sql = newValue.map(toInsertSql).join(';')
		}

		return isBack ? `${sql} RETURNING *` : sql
	}

	/**
	 * 处理删除sql
	 * @returns {string}
	 */
	removeString() {
		/** @type {Remove} */
		const { isAll, where, isBack } = this.collection.remove
		const backSql = isBack ? ' RETURNING *' : ''
		const whereSql = where?.length ? `WHERE ${this._parseWhere(where)}` : ''
		return isAll ? `DELETE FROM ${this.tableName}${backSql}` : `DELETE FROM ${this.tableName} ${whereSql}${backSql}`
	}

	/**
	 * 处理更新sql
	 * @returns {string}
	 */
	updateString() {
		/** @type {Update} */
		const { newValue, where, isBack } = this.collection.update
		const baseSql = `UPDATE ${this.tableName} SET ${this.escape(newValue)}`
		const backSql = isBack ? ' RETURNING *' : ''
		const whereSql = where?.length ? ` WHERE ${this._parseWhere(where)}` : ''
		const sql = `${baseSql}${whereSql}${backSql}`
		return sql
	}

	/**
	 * 解析 where 条件数组为 SQL 片段
	 *
	 * @description
	 * 接收一个二维数组，按顺序拼接成 SQL 的 WHERE 条件。
	 * - 三元形式：[key, operator, value]
	 * - 四元形式：[key, operator, value, connector]，connector 可为 'AND' | 'OR' 等
	 * - 特殊运算符：'IN'、'BETWEEN' 会做专门处理
	 *
	 * @param 	{Array<[string, string, any] | [string, string, any, 'AND' | 'OR']>} val	条件数组
	 * @returns {string} 拼接后的 SQL 片段（不包含前导空格与 WHERE 关键字）
	 *
	 * @example
	 * // 基本等值
	 * _parseWhere([["id", "=", 1]])
	 * // => "id = 1"
	 *
	 * @example
	 * // 多条件 AND / OR 连接
	 * _parseWhere([["status", "=", "active", "AND"], ["age", ">", 18]])
	 * // => "status = 'active' AND age > 18 "
	 *
	 * @example
	 * // IN 查询
	 * _parseWhere([["id", "IN", [1,2,3]]])
	 * // => "id IN (1,2,3) "
	 *
	 * @example
	 * // BETWEEN 查询
	 * _parseWhere([["created_at", "BETWEEN", [new Date('2024-01-01'), new Date('2024-12-31')]]])
	 * // => "created_at BETWEEN '2024-01-01T00:00:00.000Z' AND '2024-12-31T00:00:00.000Z' "
	 */
	_parseWhere(val) {
		return val.reduce((acc, next, index) => {
			const [key, oper, val, con] = next
			const _con = `${con ? ` ${con}` : ''}`
			if (next.length === 3) {
				switch (oper?.toUpperCase?.()) {
					case 'IN':
						acc += `${key} ${oper} (${this.escape(val)})${_con}`
						break
					case 'BETWEEN':
						acc += `${key} ${oper} ${this.escape(val[0])} AND ${this.escape(val[1])}${_con} `
						break
					default: {
						acc += `${key} ${oper} ${this.escape(val)}${_con}`
						break
					}
				}
			} else acc += `${key} ${oper} ${this.escape(val)}${_con}`
			return acc
		}, '')
	}

	/**
	 * @method
	 * @param 	{string} 	tableName 	表名称
	 */
	set tableName(tableName) {
		this._tableName = tableName
	}

	/**
	 * @returns {string}
	 */
	get tableName() {
		return this._tableName
	}

	/**
	 * @method
	 * @param 	{OperType} 		oper		操作名称
	 */
	set operation(oper) {
		this._operation = oper
	}

	/**
	 * @returns {OperType}
	 */
	get operation() {
		return this._operation
	}

	/**
	 * @method
	 * @param 	{History} 		obj
	 */
	set history(obj) {
		this._history.push(obj)
	}

	/**
	 * @returns {History}
	 */
	get history() {
		return this._history
	}

	/**
	 * 初始化收集器
	 */
	_initCollection() {
		this.collection = {
			query: {
				cols: '*',
				where: [],
				whereOrder: [],
				orderBy: null,
				groupBy: null,
				limit: null,
				offset: null
			},
			update: {
				newValue: {},
				where: []
			},
			remove: {
				isAll: false,
				where: []
			},
			insert: {
				newValue: null,
				isBack: false
			}
		}
	}

	/**
	 * query、update、remove、inset预操作
	 * @param 	{OperType} 	oper
	 */
	_preAction(oper) {
		this._initCollection()
		this.operation = oper
	}

	_getType(value) {
		return Object.prototype.toString.call(value).slice(8, -1).toLowerCase()
	}
}

module.exports = SqlTools
