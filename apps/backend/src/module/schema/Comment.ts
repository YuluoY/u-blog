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

	@Column({ type: 'varchar', length: 100, nullable: true, comment: '评论时客户端 IP' })
	@IsOptional()
	@IsString()
	@MaxLength(100)
	ip?: string | null

	@Column({ name: 'userAgent', type: 'text', nullable: true, comment: '评论时 User-Agent 原始串' })
	@IsOptional()
	@IsString()
	userAgent?: string | null

	@Column({ type: 'varchar', length: 100, nullable: true, comment: '评论时使用的浏览器' })
	@IsOptional()
	@IsString()
	@MaxLength(100)
	browser?: string | null

	@Column({ type: 'varchar', length: 100, nullable: true, comment: '评论时使用的设备类型' })
	@IsOptional()
	@IsString()
	@MaxLength(100)
	device?: string | null

	@Column({ name: 'ipLocation', type: 'varchar', length: 255, nullable: true, comment: 'IP 解析的地名' })
	@IsOptional()
	@IsString()
	@MaxLength(255)
	ipLocation?: string | null
}
