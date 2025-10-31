const { Tables } = require('../../constants')
const BaseSchema = require('../logic/BaseSchema')

class Media extends BaseSchema {
	static tableName = Tables.MEDIA
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
			${force ? `DROP TABLE IF EXISTS ${Media.tableName} CASCADE` : ''}
			CREATE TABLE IF NOT EXISTS ${Media.tableName} (
				id            	BIGSERIAL 					PRIMARY KEY,
				name          	VARCHAR(255) 				NOT NULL,
				originalName  	VARCHAR(255) 				NOT NULL,
				type            VARCHAR(50) 				NOT NULL,
				mineType        VARCHAR(20) 				NOT NULL,
				url           	VARCHAR(255) 				NOT NULL,
				ext             VARCHAR(20) 				NOT NULL,
				size            BIGINT,
				hash            VARCHAR(255) 				NOT NULL,
				thumbnail       VARCHAR(255) 				DEFAULT NULL,
				width						SMALLINT          	DEFAULT NULL,
				height					SMALLINT          	DEFAULT NULL,
				duration				INTEGER          		DEFAULT NULL,
				"articleId"    	INTEGER							DEFAULT NULL,
				"commentId"    	BIGINT							DEFAULT NULL,
				"userId"        INTEGER,
				"createdAt"     TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,
				"updatedAt"     TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,
				"deletedAt"     TIMESTAMP           DEFAULT NULL,
				FOREIGN KEY ("articleId") REFERENCES ${Tables.ARTICLE} (id) ON DELETE CASCADE,
				FOREIGN KEY ("commentId") REFERENCES ${Tables.COMMENT} (id) ON DELETE CASCADE,
				FOREIGN KEY ("userId") REFERENCES ${Tables.USERS} (id) ON DELETE CASCADE
			)
		`)

		// 添加表字段备注
		await this.client.query(`
			COMMENT ON COLUMN ${Media.tableName}.id IS '主键';
			COMMENT ON COLUMN ${Media.tableName}.name IS '名称';
			COMMENT ON COLUMN ${Media.tableName}.originalName IS '原始名称';
			COMMENT ON COLUMN ${Media.tableName}.type IS '类型';
			COMMENT ON COLUMN ${Media.tableName}.mineType IS '媒体类型';
			COMMENT ON COLUMN ${Media.tableName}.url IS '地址';
			COMMENT ON COLUMN ${Media.tableName}.ext IS '扩展名';
			COMMENT ON COLUMN ${Media.tableName}.size IS '大小';
			COMMENT ON COLUMN ${Media.tableName}.hash IS '哈希值';
			COMMENT ON COLUMN ${Media.tableName}.thumbnail IS '缩略图';
			COMMENT ON COLUMN ${Media.tableName}.width IS '宽度';
			COMMENT ON COLUMN ${Media.tableName}.height IS '高度';
			COMMENT ON COLUMN ${Media.tableName}."articleId" IS '文章id';
			COMMENT ON COLUMN ${Media.tableName}."commentId" IS '评论id';
			COMMENT ON COLUMN ${Media.tableName}."userId" IS '用户id';
			COMMENT ON COLUMN ${Media.tableName}.duration IS '时长';
			COMMENT ON COLUMN ${Media.tableName}."createdAt" IS '创建时间';
			COMMENT ON COLUMN ${Media.tableName}."updatedAt" IS '更新时间';
			COMMENT ON COLUMN ${Media.tableName}."deletedAt" IS '删除时间';
			COMMENT ON TABLE ${Media.tableName} IS '媒体表';
		`)
	}
}

module.exports = Media

