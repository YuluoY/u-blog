/**
 * sql 函数触发器工具类
 */
const JSDoc = require('../type')
const { cloneDeep } = require('lodash')

/**
 * The BaseTriggerFunc options
 * @typedef {Object} IBaseTriggerFuncOptions
 */

/**
 * The Namespace of BaseTriggerFunc class
 * @typedef {keyof BaseTriggerFunc.Namespace} IBaseTriggerFuncNamespace
 */

class BaseTriggerFunc {
	/**
	 * The namespace of BaseTriggerFunc
	 * @constant
	 * @static
	 */
	static Namespace = Object.freeze({
		UPDATED_AT_TRIGGER: 'updated_at_trigger'
	})

	/**
	 * @param {JSDoc.Client} client
	 * @param {IBaseTriggerFuncOptions} opts
	 */
	constructor(client = null, opts = {}) {
		if (!client) throw new Error('BaseTriggerFunc: client is required')
		this.client = client
		Object.assign(this, cloneDeep(opts))
		this._rawOpts = opts
	}
}

module.exports = BaseTriggerFunc
