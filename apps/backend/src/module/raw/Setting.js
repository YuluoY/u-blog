const { Tables } = require('../../constants')
const BaseSchema = require('../logic/BaseSchema')

class Setting extends BaseSchema {
	static tableName = Tables.SETTING
	/**
	 * @param {Client} client
	 */
	constructor(client = null) {
		super(client)
	}

	async initCustomType() {}
	async initTriggerFunc() {}
	async initFunc() {}
	async createSchema() {}
}

module.exports = Setting

