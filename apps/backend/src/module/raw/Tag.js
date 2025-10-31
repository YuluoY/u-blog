/**
 * 标签表
 *
 * @typedef {import('pg').Client} Client
 */

const { Tables } = require('../../constants')
const BaseSchema = require('../logic/BaseSchema')

class Tag extends BaseSchema {
	static tableName = Tables.TAG

	/**
	 * @param {Client} client
	 */
	constructor(client = null) {
		super(client)
	}

	async createSchema(force = false) {
		// // 创建枚举类型
		await this.client.query(`
		${force ? `DROP TABLE IF EXISTS ${Tag.tableName} CASCADE` : ''}
		CREATE TABLE IF NOT EXISTS ${Tag.tableName} (
			id 						      SMALLSERIAL 			PRIMARY KEY,
      name 					      VARCHAR(50) 	    NOT NULL UNIQUE,
      desc 		    				VARCHAR(255) 	    DEFAULT NULL,
			color 							VARCHAR(50) 	    DEFAULT NULL,
			"userId" 						INTEGER,
      "createdAt"         TIMESTAMP         DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"         TIMESTAMP         DEFAULT CURRENT_TIMESTAMP,
      "deletedAt"         TIMESTAMP         DEFAULT NULL,
      FOREIGN KEY ("userId") REFERENCES ${Tables.USERS} ("id") ON DELETE CASCADE
		)
		`)

		// 添加字段备注
		await this.client.query(`
      COMMENT ON COLUMN ${Tag.tableName}.id              IS '主键';
      COMMENT ON COLUMN ${Tag.tableName}.name            IS '标签名称';
      COMMENT ON COLUMN ${Tag.tableName}.desc     			 IS '标签描述';
			COMMENT ON COLUMN ${Tag.tableName}.color     			 IS '标签颜色';
			COMMENT ON COLUMN ${Tag.tableName}."userId"        IS '用户id';
      COMMENT ON COLUMN ${Tag.tableName}."createdAt"     IS '创建时间';
      COMMENT ON COLUMN ${Tag.tableName}."updatedAt"     IS '更新时间';
      COMMENT ON COLUMN ${Tag.tableName}."deletedAt"     IS '删除时间';
      COMMENT ON TABLE ${Tag.tableName}                  IS '标签表';
    `)

		// 创建日期触发器
		// await BaseSchema.createTimeTrigger(Tag.name, 'updatedAt', client)
	}
}

module.exports = Tag

