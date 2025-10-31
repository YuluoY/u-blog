const JSDoc = require('../type')
const BaseType = require('./BaseType')
const BaseTriggerFunc = require('./BaseTriggerFunc')
const BaseFunc = require('./BaseFunc')

/**
 * 基本表实体类
 *  - 定义一些接口用于外部继承实现
 *  - 定义一些基础字段
 *
 * @typedef {object} IBaseSchemaOptions
 * @property {tableName} [tableName=''] 表名
 */
class BaseSchema {
	/**
	 * The table name of this schema.
	 * @type {string}
	 */
	static tableName = ''

	/**
	 * The TypeVar of BaseType class instance.
	 * @type {BaseType}
	 */
	TypeVar = null
	/**
	 * The FuncVar of BaseFunc class instance.
	 * @type {BaseFunc}
	 */
	FuncVar = null

	/**
	 * The TriggerFuncVar of BaseTriggerFunc class instance.
	 * @type {BaseTriggerFunc}
	 */
	TriggerFuncVar = null

	/**
	 * @param {JSDoc.Client} client
	 * @param {Object} opts
	 */
	constructor(client = null, opts = {}) {
		if (!client && !this.client) throw new Error('BaseSchema: client is required')
		this.client = this.client || client
		BaseSchema.tableName = opts.tableName || BaseSchema.tableName

		this.TypeVar = new BaseType(this.client, opts.typeOpts)
		this.FuncVar = new BaseFunc(this.client, opts.funcOpts)
		this.TriggerFuncVar = new BaseTriggerFunc(this.client, opts.triggerFuncOpts)
	}

	/**
	 * 初始化函数，用于初始化Users类所需要的自定义类型、触发器、表结构等
	 * @method
	 * @returns {Promise<void>}
	 */
	async init() {
		await this.initFunc()
		await this.initTriggerFunc()
		await this.initCustomType()
		await this.createSchema(false)
		await this.exec()
	}

	/**
	 * 初始化执行区，做一些前置操作
	 * @method
	 * @returns {Promise<void>}
	 */
	async exec() {}

	/**
	 * 初始化触发器
	 * @method
	 * @returns {Promise<void>}
	 */
	async initTriggerFunc() {}

	/**
	 * 初始化函数
	 * @method
	 * @returns {Promise<void>}
	 */
	async initFunc() {}

	/**
	 * 初始化自定义类型
	 * @method
	 * @returns {Promise<void>}
	 */
	async initCustomType() {}

	/**
	 * 创建表结构
	 * @method
	 * @returns {Promise<void>}
	 */
	async createSchema() {}
}

module.exports = BaseSchema
