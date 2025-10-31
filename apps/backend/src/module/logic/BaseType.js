const JSDoc = require('../type')
const { cloneDeep } = require('lodash')
const { TYPE } = require('../constants')
/**
 * The constructor options of BaseType class
 * @typedef {object} IBaseTypeOptions
 */

class BaseType {
	/**
	 * @param {JSDoc.Client} client
	 * @param {IBaseFuncOptions} opts
	 */
	constructor(client = null, opts = {}) {
		if (!client) {
			throw new Error('BaseType: client is required')
		}
		this.client = client
		Object.assign(this, cloneDeep(opts))
		this._rawOpts = opts
	}

	/**
	 * 创建自定义类型
	 * @param {JSDoc.ITypes} 	type
	 * @param  {...any} args
	 * @returns {Promise<void>}
	 */
	async createType(type, ...args) {
		switch (type) {
			case TYPE.ENUM:
				return await this.createEnumType(...args)
			default:
				break
		}
	}

	/**
	 * 删除类型
	 * @param {string} name 类型名称
	 * @param {object} opts 选项
	 * @param {boolean} [opts.isCascade=false] 是否级联删除
	 * @returns {Promise<void>}
	 */
	async dropType(name, opts = {}) {
		try {
			await this.client.query(`DROP TYPE IF EXISTS ${name} ${opts.isCascade ? 'CASCADE' : ''};`)
		} catch (error) {
			console.log(`dropType error: ${error}`)
		}
	}

	/**
	 * 创建自定义枚举类型
	 * @param     {string}     name        类型名称
	 * @param     {string[]}          values      枚举值
	 * @returns 	{Promise<void>}
	 */
	async createEnumType(name, values) {
		try {
			await this.client.query(`CREATE TYPE ${name} AS ENUM ('${values.join("', '")}');`)
		} catch (error) {
			console.log(`createEnumType error: ${error}`)
		}
	}

	/**
	 * 是否存在自定义类型
	 * @param   {string}   							name            类型名称
	 * @param   {object}              	opts            选项
	 * @param   {boolean}           		[opts.isDel=false]      是否删除
	 * @param   {boolean}           		[opts.isCascade=false]  是否级联删除
	 * @returns {Promise<boolean>}
	 */
	async isExistType(name, opts = {}) {
		if (!name) {
			throw new Error('BaseType: name is required')
		}
		const { isDel = false, isCascade = false } = opts
		const res = await this.client.query(`
			SELECT EXISTS (
				SELECT 1 
				FROM pg_type 
				WHERE typname = '${name}'
			);
		`)
		if (isDel && res.rows[0].exists) {
			await this.dropType(name, { isCascade })
		}
		return res.rows[0].exists
	}
}

module.exports = BaseType
