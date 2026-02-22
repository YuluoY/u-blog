import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Check } from 'typeorm'
import { CTable } from '@u-blog/model'
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator'
import { Users } from './Users'
import { Article } from './Article'
import { Comment } from './Comment'
import { BaseSchema } from '../BaseSchema'

/**
 * 点赞表
 */
@Entity({ name: CTable.LIKE, comment: '点赞表' })
@Check(`("articleId" IS NOT NULL AND "commentId" IS NULL) OR ("articleId" IS NULL AND "commentId" IS NOT NULL)`)
@BaseSchema
export class Likes {
	@PrimaryGeneratedColumn({ type: 'bigint', comment: '主键' })
	id!: number

	@Column({ name: 'userId', type: 'int', nullable: true, comment: '用户id（游客点赞为 null）' })
	@IsOptional()
	@IsInt({ message: '用户ID必须为整数' })
	userId?: number | null

	@ManyToOne(() => Users)
	@JoinColumn({ name: 'userId' })
	user?: Users | null

	@Column({ name: 'articleId', type: 'int', nullable: true, comment: '文章id' })
	@ValidateIf((o) => o.commentId == null)
	@IsNotEmpty({ message: '文章ID和评论ID必须有一个不为空' })
	@IsInt({ message: '文章ID必须为整数' })
	articleId?: number | null

	@ManyToOne(() => Article)
	@JoinColumn({ name: 'articleId' })
	article?: Article | null

	@Column({ name: 'commentId', type: 'bigint', nullable: true, comment: '评论id' })
	@ValidateIf((o) => o.articleId == null)
	@IsNotEmpty({ message: '文章ID和评论ID必须有一个不为空' })
	@IsInt({ message: '评论ID必须为整数' })
	commentId?: number | null

	@ManyToOne(() => Comment)
	@JoinColumn({ name: 'commentId' })
	comment?: Comment | null

	/** 游客点赞时的客户端 IP */
	@Column({ type: 'varchar', length: 100, nullable: true, comment: '客户端 IP' })
	@IsOptional()
	@IsString()
	@MaxLength(100)
	ip?: string | null

	/** 游客点赞时的浏览器指纹 */
	@Column({ type: 'varchar', length: 64, nullable: true, comment: '浏览器指纹' })
	@IsOptional()
	@IsString()
	@MaxLength(64)
	fingerprint?: string | null

}
