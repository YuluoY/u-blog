const { Tables } = require('../../constants')
const BaseSchema = require('../logic/BaseSchema')

class Likes extends BaseSchema {
	static tableName = Tables.LIKES
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
			${force ? `DROP TABLE IF EXISTS ${Likes.tableName} CASCADE` : ''}
			CREATE TABLE IF NOT EXISTS ${Likes.tableName} (
				id							BIGSERIAL   			PRIMARY KEY,
				"userId"			  INTEGER   					NOT NULL,
				"articleId"		 	INTEGER   					DEFAULT NULL,
				"commentId"		 	BIGINT						DEFAULT NULL,
				"createdAt"     TIMESTAMP   			DEFAULT CURRENT_TIMESTAMP,
				"updatedAt"     TIMESTAMP   			DEFAULT CURRENT_TIMESTAMP,
				"deletedAt"     TIMESTAMP					DEFAULT NULL,
				FOREIGN KEY ("userId") REFERENCES ${Tables.USERS} ("id") ON DELETE CASCADE,
				FOREIGN KEY ("articleId") REFERENCES ${Tables.ARTICLE} ("id") ON DELETE CASCADE,
				FOREIGN KEY ("commentId") REFERENCES ${Tables.COMMENT} ("id") ON DELETE CASCADE,
				CHECK (("articleId" IS NOT NULL AND "commentId" IS NULL) OR ("articleId" IS NULL AND "commentId" IS NOT NULL))
			)
		`)

		// 添加表字段备注
		await this.client.query(`
			COMMENT ON COLUMN ${Likes.tableName}.id IS '主键';
			COMMENT ON COLUMN ${Likes.tableName}."userId" IS '用户id';
			COMMENT ON COLUMN ${Likes.tableName}."articleId" IS '文章id';
			COMMENT ON COLUMN ${Likes.tableName}."commentId" IS '评论id';
			COMMENT ON COLUMN ${Likes.tableName}."createdAt" IS '创建时间';
			COMMENT ON COLUMN ${Likes.tableName}."updatedAt" IS '更新时间';
			COMMENT ON COLUMN ${Likes.tableName}."deletedAt" IS '删除时间';
			COMMENT ON TABLE ${Likes.tableName} IS '点赞表';
		`)
	}
}

module.exports = Likes

