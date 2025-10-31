import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, Check } from 'typeorm'
import { CTable } from '@u-blog/model'
import { IsInt, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator'
import { Users } from './Users'
import { Article } from './Article'
import { Comment } from './Comment'

/**
 * 点赞表
 */
@Entity({ name: CTable.LIKE, comment: '点赞表' })
@Check(`("articleId" IS NOT NULL AND "commentId" IS NULL) OR ("articleId" IS NULL AND "commentId" IS NOT NULL)`)
export class Likes {
	@PrimaryGeneratedColumn({ type: 'bigint', comment: '主键' })
	id!: number

	@Column({ name: 'userId', type: 'int', comment: '用户id' })
	@IsNotEmpty({ message: '用户ID不能为空' })
	@IsInt({ message: '用户ID必须为整数' })
	userId!: number

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

	@CreateDateColumn({ name: 'createdAt', type: 'timestamp', comment: '创建时间' })
	createdAt!: Date

	@UpdateDateColumn({ name: 'updatedAt', type: 'timestamp', comment: '更新时间' })
	updatedAt!: Date

	@DeleteDateColumn({ name: 'deletedAt', type: 'timestamp', nullable: true, comment: '删除时间' })
	deletedAt?: Date | null
}
