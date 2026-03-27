import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { CTable } from '@u-blog/model'
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator'
import { Users } from './Users'
import { Article } from './Article'
import { Comment } from './Comment'
import { Moment } from './Moment'
import { BaseSchema } from '../BaseSchema'

/**
 * 点赞表 —— 支持文章、评论、动态三种实体的点赞
 *
 * articleId / commentId / momentId 中至少有一个非空，标识点赞目标。
 */
@Entity({ name: CTable.LIKE, comment: '点赞表' })
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
	@IsOptional()
	@IsInt({ message: '文章ID必须为整数' })
	articleId?: number | null

	@ManyToOne(() => Article)
	@JoinColumn({ name: 'articleId' })
	article?: Article | null

	@Column({ name: 'commentId', type: 'bigint', nullable: true, comment: '评论id' })
	@IsOptional()
	@IsInt({ message: '评论ID必须为整数' })
	commentId?: number | null

	@ManyToOne(() => Comment)
	@JoinColumn({ name: 'commentId' })
	comment?: Comment | null

	@Column({ name: 'momentId', type: 'bigint', nullable: true, comment: '动态id' })
	@IsOptional()
	@IsInt({ message: '动态ID必须为整数' })
	momentId?: number | null

	@ManyToOne(() => Moment)
	@JoinColumn({ name: 'momentId' })
	moment?: Moment | null

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
