const { Tables } = require('../../constants')
const BaseSchema = require('../logic/BaseSchema')

class ActivityLog extends BaseSchema {
	static tableName = Tables.ACTIVITY_LOG
	/**
	 * @param {Client} client
	 */
	constructor(client = null) {
		super(client)
	}

	async initCustomType() {}
	async initTriggerFunc() {}
	async initFunc() {}
	async createSchema(force = false) {
		// 创建表
		await this.client.query(`
			${force ? `DROP TABLE IF EXISTS ${ActivityLog.tableName} CASCADE` : ''}
			CREATE TABLE IF NOT EXISTS ${ActivityLog.tableName} (
				id 								SERIAL         	 PRIMARY KEY,
				"userId" 					INTEGER           	 NOT NULL,
				action    				VARCHAR(255)      	 NOT NULL,
				"createdAt" 			TIMESTAMP						 DEFAULT CURRENT_TIMESTAMP,
				"updatedAt" 			TIMESTAMP						 DEFAULT CURRENT_TIMESTAMP,
				"deletedAt" 			TIMESTAMP						 DEFAULT NULL,
				FOREIGN KEY ("userId") REFERENCES ${Tables.USERS} ("id") ON DELETE CASCADE
			)
		`)

		// 添加字段备注
		await this.client.query(`
			COMMENT ON COLUMN ${ActivityLog.tableName}."id" IS '主键ID';
			COMMENT ON COLUMN ${ActivityLog.tableName}."userId" IS '用户ID';
			COMMENT ON COLUMN ${ActivityLog.tableName}."action" IS '操作';
			COMMENT ON COLUMN ${ActivityLog.tableName}."createdAt" IS '创建时间';
			COMMENT ON COLUMN ${ActivityLog.tableName}."updatedAt" IS '更新时间';
			COMMENT ON COLUMN ${ActivityLog.tableName}."deletedAt" IS '删除时间';
			COMMENT ON TABLE ${ActivityLog.tableName} IS '操作日志表';
		`)
	}
}

module.exports = ActivityLog

