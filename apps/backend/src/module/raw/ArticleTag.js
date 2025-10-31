const { Tables } = require('../../constants')
const BaseSchema = require('../logic/BaseSchema')

class ArticleTag extends BaseSchema {
	static tableName = Tables.ARTICLE_TAG
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
			${force ? `DROP TABLE IF EXISTS ${ArticleTag.tableName} CASCADE` : ''}
			CREATE TABLE IF NOT EXISTS ${ArticleTag.tableName}(
				id       				BIGSERIAL 				PRIMARY KEY,
				"articleId" 		INTEGER 					NOT NULL,
				"tagId" 				SMALLINT 					NOT NULL,
				"createdAt" 		TIMESTAMP 			DEFAULT CURRENT_TIMESTAMP,
				"updatedAt" 		TIMESTAMP 			DEFAULT CURRENT_TIMESTAMP,
				"deletedAt" 		TIMESTAMP 			DEFAULT NULL,
				FOREIGN KEY ("articleId") REFERENCES ${Tables.ARTICLE}("id") ON DELETE CASCADE,
				FOREIGN KEY ("tagId") REFERENCES ${Tables.TAG}("id") ON DELETE CASCADE
			)
		`)

		// 添加表字段备注
		await this.client.query(`
			COMMENT ON COLUMN article_tag.id IS '主键';
			COMMENT ON COLUMN article_tag."articleId" IS '文章id';
			COMMENT ON COLUMN article_tag."tagId" IS '标签id';
			COMMENT ON COLUMN article_tag."createdAt" IS '创建时间';
			COMMENT ON COLUMN article_tag."updatedAt" IS '更新时间';
			COMMENT ON COLUMN article_tag."deletedAt" IS '删除时间';
			COMMENT ON TABLE article_tag IS '文章标签表';
		`)
	}
}

module.exports = ArticleTag

