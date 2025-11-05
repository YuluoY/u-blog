import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { CTable } from '@u-blog/model'
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { Article } from './Article'
import { Users } from './Users'
import { BaseSchema } from '../BaseSchema'

/**
 * 评论表
 */
@Entity({ name: CTable.COMMENT, comment: '评论表' })
@BaseSchema
export class Comment {
	@PrimaryGeneratedColumn({ type: 'bigint', comment: '主键' })
	id!: number

	@Column({ name: 'articleId', type: 'int', nullable: true, comment: '文章id' })
	@IsOptional()
	@IsInt({ message: '文章ID必须为整数' })
	articleId?: number | null

	@ManyToOne(() => Article)
	@JoinColumn({ name: 'articleId' })
	article?: Article | null

	@Column({ name: 'userId', type: 'int', comment: '用户id' })
	@IsNotEmpty({ message: '用户ID不能为空' })
	@IsInt({ message: '用户ID必须为整数' })
	userId!: number

	@ManyToOne(() => Users)
	@JoinColumn({ name: 'userId' })
	user?: Users | null

	@Column({ type: 'text', comment: '评论内容' })
	@IsNotEmpty({ message: '评论内容不能为空' })
	@IsString({ message: '评论内容必须为字符串' })
	content!: string

	@Column({ type: 'varchar', length: 255, comment: '评论路由路径' })
	@IsNotEmpty({ message: '评论路由路径不能为空' })
	@IsString({ message: '评论路由路径必须为字符串' })
	@MaxLength(255, { message: '评论路由路径最多255个字符' })
	path!: string

	@Column({ type: 'bigint', nullable: true, comment: '父评论id' })
	@IsOptional()
	@IsInt({ message: '父评论ID必须为整数' })
	pid?: number | null

	@ManyToOne(() => Comment)
	@JoinColumn({ name: 'pid' })
	parent?: Comment | null
}
