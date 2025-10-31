import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm'
import { CTable } from '@u-blog/model'
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator'
import { Users } from './Users'
import { Article } from './Article'

/**
 * 作者表 - 用户和文章的多对多关联表
 */
@Entity({ name: CTable.AUTHOR, comment: '作者表' })
@Unique(['userId', 'articleId'])
export class Author {
	@PrimaryGeneratedColumn({ type: 'int', comment: '主键' })
	id!: number

	@Column({ name: 'userId', type: 'int', comment: '用户ID' })
	@IsNotEmpty({ message: '用户ID不能为空' })
	@IsInt({ message: '用户ID必须为整数' })
	userId!: number

	@ManyToOne(() => Users)
	@JoinColumn({ name: 'userId' })
	user?: Users | null

	@Column({ name: 'articleId', type: 'int', comment: '文章ID' })
	@IsNotEmpty({ message: '文章ID不能为空' })
	@IsInt({ message: '文章ID必须为整数' })
	articleId!: number

	@ManyToOne(() => Article)
	@JoinColumn({ name: 'articleId' })
	article?: Article | null

	@Column({ name: 'order', type: 'smallint', default: 0, comment: '排序' })
	@IsInt({ message: '排序必须为整数' })
	@Min(0, { message: '排序不能小于0' })
	order!: number

	@Column({ type: 'text', nullable: true, comment: '贡献描述' })
	@IsOptional()
	@IsString({ message: '贡献描述必须为字符串' })
	contribution?: string | null

	@CreateDateColumn({ name: 'createdAt', type: 'timestamp', comment: '创建时间' })
	createdAt!: Date

	@UpdateDateColumn({ name: 'updatedAt', type: 'timestamp', comment: '更新时间' })
	updatedAt!: Date

	@DeleteDateColumn({ name: 'deletedAt', type: 'timestamp', nullable: true, comment: '删除时间' })
	deletedAt?: Date | null
}
