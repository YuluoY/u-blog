const { Tables } = require('../../constants')
const BaseSchema = require('../logic/BaseSchema')

class Category extends BaseSchema {
	static tableName = Tables.CATEGORY
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
			${force ? `DROP TABLE IF EXISTS ${Category.tableName} CASCADE` : ''}
			CREATE TABLE IF NOT EXISTS ${Category.tableName} (
				id        		SMALLSERIAL       PRIMARY KEY,
				name      		VARCHAR(50)       UNIQUE NOT NULL,
				desc 					VARCHAR(255)     	DEFAULT NULL,
				"userId" 			INTEGER,
				"createdAt" 	TIMESTAMP         DEFAULT CURRENT_TIMESTAMP,
				"updatedAt" 	TIMESTAMP         DEFAULT CURRENT_TIMESTAMP,
				"deletedAt" 	TIMESTAMP         DEFAULT NULL,
				FOREIGN KEY ("userId") REFERENCES ${Tables.USERS}("id") ON DELETE CASCADE
			)
		`)

		// 添加表字段备注
		await this.client.query(`
			COMMENT ON COLUMN ${Category.tableName}.id 						IS '主键';
			COMMENT ON COLUMN ${Category.tableName}.name 					IS '分类名称';
			COMMENT ON COLUMN ${Category.tableName}.desc 					IS '分类描述';
			COMMENT ON COLUMN ${Category.tableName}."userId" 			IS '用户id';
			COMMENT ON COLUMN ${Category.tableName}."createdAt" 		IS '创建时间';
			COMMENT ON COLUMN ${Category.tableName}."updatedAt" 		IS '更新时间';
			COMMENT ON COLUMN ${Category.tableName}."deletedAt" 		IS '删除时间';
			COMMENT ON TABLE ${Category.tableName} 								IS '分类表';
		`)
	}
}

module.exports = Category

