const { Tables } = require('../../constants')
const BaseSchema = require('../logic/BaseSchema')

class Follower extends BaseSchema {
	static tableName = Tables.FOLLOWER
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
			${force ? `DROP TABLE IF EXISTS ${Follower.tableName} CASCADE` : ''}
			CREATE TABLE IF NOT EXISTS ${Follower.tableName} (
				id   							BIGSERIAL  						PRIMARY KEY,
				"followerId"			INTEGER								NOT NULL,
				"followingId"			INTEGER								NOT NULL,
				"createdAt"       TIMESTAMP    					DEFAULT CURRENT_TIMESTAMP,
				"updatedAt"       TIMESTAMP    					DEFAULT CURRENT_TIMESTAMP,
				"deletedAt"       TIMESTAMP    					DEFAULT NULL,
				FOREIGN KEY ("followerId") REFERENCES ${Tables.USERS} ("id") ON DELETE CASCADE,
				FOREIGN KEY ("followingId") REFERENCES ${Tables.USERS} ("id") ON DELETE CASCADE
			)
		`)

		// 添加表字段备注
		await this.client.query(`
			COMMENT ON COLUMN ${Follower.tableName}.id IS '主键';
			COMMENT ON COLUMN ${Follower.tableName}."followerId" IS '粉丝id';
			COMMENT ON COLUMN ${Follower.tableName}."followingId" IS '关注id';
			COMMENT ON COLUMN ${Follower.tableName}."createdAt" IS '创建时间';
			COMMENT ON COLUMN ${Follower.tableName}."updatedAt" IS '更新时间';
			COMMENT ON COLUMN ${Follower.tableName}."deletedAt" IS '删除时间';
			COMMENT ON TABLE ${Follower.tableName} IS '粉丝表';
		`)
	}
}

module.exports = Follower

