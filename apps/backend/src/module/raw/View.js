/**
 * 访问表
 */

const { Tables } = require('../../constants')
const BaseSchema = require('../logic/BaseSchema')

class View extends BaseSchema {
	static tableName = Tables.VIEW
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
			${force ? `DROP TABLE IF EXISTS ${View.tableName} CASCADE` : ''}
			CREATE TABLE IF NOT EXISTS ${View.tableName} (
				id 							BIGSERIAL   				PRIMARY KEY,
				ip							VARCHAR(255)				DEFAULT NULL,
				agent						VARCHAR(255)				DEFAULT NULL,
				address					VARCHAR(255)				DEFAULT NULL,
				ip							VARCHAR(50)				DEFAULT NULL,
				"userId"				INTEGER,
				"articleId"			INTEGER,
				"routeId"				SMALLINT,
				"createdAt"			TIMESTAMP     			DEFAULT CURRENT_TIMESTAMP,
				"updatedAt"			TIMESTAMP     			DEFAULT CURRENT_TIMESTAMP,
				"deletedAt"			TIMESTAMP     			DEFAULT NULL,
				FOREIGN KEY ("userId") REFERENCES ${Tables.USERS} ("id") ON DELETE CASCADE,
				FOREIGN KEY ("articleId") REFERENCES ${Tables.ARTICLE} ("id") ON DELETE CASCADE,
				FOREIGN KEY ("routeId") REFERENCES ${Tables.ROUTE} ("id") ON DELETE CASCADE
			)
		`)

		// 添加表字段备注
		await this.client.query(`
			COMMENT ON COLUMN ${View.tableName}.id IS '主键';
			COMMENT ON COLUMN ${View.tableName}.ip IS '访问者ip';
			COMMENT ON COLUMN ${View.tableName}.agent IS '访问者浏览器';
			COMMENT ON COLUMN ${View.tableName}.address IS '访问者地址';
			COMMENT ON COLUMN ${View.tableName}.ip IS 'ip地址';
			COMMENT ON COLUMN ${View.tableName}."userId" IS '访问者id';
			COMMENT ON COLUMN ${View.tableName}."articleId" IS '文章id';
			COMMENT ON COLUMN ${View.tableName}."routeId" IS '路由id';
			COMMENT ON COLUMN ${View.tableName}."createdAt" IS '创建时间';
			COMMENT ON COLUMN ${View.tableName}."updatedAt" IS '更新时间';
			COMMENT ON COLUMN ${View.tableName}."deletedAt" IS '删除时间';
			COMMENT ON TABLE ${View.tableName} IS '访问表';
		`)
	}
}

module.exports = View

