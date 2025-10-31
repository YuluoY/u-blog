const { Tables } = require('../../constants')
const BaseSchema = require('../logic/BaseSchema')

class Comment extends BaseSchema {
	static tableName = Tables.COMMENT
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
			${force ? `DROP TABLE IF EXISTS ${Comment.tableName} CASCADE` : ''}
			CREATE TABLE IF NOT EXISTS ${Comment.tableName} (
				id       				BIGSERIAL 				PRIMARY KEY,
				"articleId"			INTEGER,
				"userId"				INTEGER 					NOT NULL,
				content 				TEXT 							NOT NULL,
				path 						VARCHAR(255)			NOT NULL,
				pid 						BIGINT						DEFAULT NULL,
				"createdAt" 	  TIMESTAMP   			DEFAULT CURRENT_TIMESTAMP,
				"updatedAt" 	  TIMESTAMP   			DEFAULT CURRENT_TIMESTAMP,
				"deletedAt" 	 	TIMESTAMP   			DEFAULT NULL,
				FOREIGN KEY ("articleId") REFERENCES ${Tables.ARTICLE}("id") ON DELETE CASCADE,
				FOREIGN KEY ("userId") REFERENCES ${Tables.USERS}("id") ON DELETE CASCADE,
				FOREIGN KEY (pid) REFERENCES ${Tables.COMMENT}("id") ON DELETE RESTRICT
			)
		`)

		// 添加表字段备注
		await this.client.query(`
			COMMENT ON COLUMN ${Comment.tableName}.id IS '主键';
			COMMENT ON COLUMN ${Comment.tableName}."articleId" IS '文章id';
			COMMENT ON COLUMN ${Comment.tableName}."userId" IS '用户id';
			COMMENT ON COLUMN ${Comment.tableName}.content IS '评论内容';
			COMMENT ON COLUMN ${Comment.tableName}.path IS '评论路由路径';
			COMMENT ON COLUMN ${Comment.tableName}.pid IS '父评论id';
			COMMENT ON COLUMN ${Comment.tableName}."createdAt" IS '创建时间';
			COMMENT ON COLUMN ${Comment.tableName}."updatedAt" IS '更新时间';
			COMMENT ON COLUMN ${Comment.tableName}."deletedAt" IS '删除时间';
			COMMENT ON TABLE ${Comment.tableName} IS '评论表';
		`)
	}
}

module.exports = Comment

