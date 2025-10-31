import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { CTable } from '@u-blog/model'
import { IsInt, IsNotEmpty } from 'class-validator'
import { Article } from './Article'
import { Tag } from './Tag'

/**
 * 文章标签表
 */
@Entity({ name: CTable.ARTICLE_TAG, comment: '文章标签表' })
export class ArticleTag {
	@PrimaryGeneratedColumn({ type: 'bigint', comment: '主键' })
	id!: number

	@Column({ name: 'articleId', type: 'int', comment: '文章id' })
	@IsNotEmpty({ message: '文章ID不能为空' })
	@IsInt({ message: '文章ID必须为整数' })
	articleId!: number

	@ManyToOne(() => Article)
	@JoinColumn({ name: 'articleId' })
	article?: Article | null

	@Column({ name: 'tagId', type: 'smallint', comment: '标签id' })
	@IsNotEmpty({ message: '标签ID不能为空' })
	@IsInt({ message: '标签ID必须为整数' })
	tagId!: number

	@ManyToOne(() => Tag)
	@JoinColumn({ name: 'tagId' })
	tag?: Tag | null

	@CreateDateColumn({ name: 'createdAt', type: 'timestamp', comment: '创建时间' })
	createdAt!: Date

	@UpdateDateColumn({ name: 'updatedAt', type: 'timestamp', comment: '更新时间' })
	updatedAt!: Date

	@DeleteDateColumn({ name: 'deletedAt', type: 'timestamp', nullable: true, comment: '删除时间' })
	deletedAt?: Date | null
}
