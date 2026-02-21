import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm'
import { CTable, CArticleStatus, type ArticleStatus } from '@u-blog/model'
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator'
import { Users } from './Users'
import { Category } from './Category'
import { BaseSchema } from '../BaseSchema'
import { Tag } from './Tag'

/**
 * 文章表
 */
@Entity({ name: CTable.ARTICLE, comment: '文章表' })
@BaseSchema
export class Article {
	@PrimaryGeneratedColumn({ type: 'int', comment: '主键' })
	id!: number

	@Column({ name: 'userId', type: 'int', comment: '创建人ID' })
	@IsNotEmpty({ message: '创建人ID不能为空' })
	@IsInt({ message: '创建人ID必须为整数' })
	userId!: number

	@ManyToOne(() => Users)
	@JoinColumn({ name: 'userId' })
	user?: Users | null

	@Column({ name: 'categoryId', type: 'smallint', nullable: true, comment: '分类ID' })
	@IsOptional()
	@IsInt({ message: '分类ID必须为整数' })
	categoryId?: number | null

	@ManyToOne(() => Category)
	@JoinColumn({ name: 'categoryId' })
	category?: Category | null

	@ManyToMany(() => Tag)
	@JoinTable({
		name: CTable.ARTICLE_TAG,
		joinColumn: { name: 'articleId', referencedColumnName: 'id' },
		inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' }
	})
	tags?: Tag[] | null

	@Column({ type: 'varchar', length: 100, unique: true, comment: '标题' })
	@IsNotEmpty({ message: '标题不能为空' })
	@IsString({ message: '标题必须为字符串' })
	@MaxLength(100, { message: '标题最多100个字符' })
	title!: string

	@Column({ type: 'text', comment: '内容' })
	@IsNotEmpty({ message: '内容不能为空' })
	@IsString({ message: '内容必须为字符串' })
	content!: string

	@Column({ type: 'text', nullable: true, comment: '描述' })
	@IsOptional()
	@IsString({ message: '描述必须为字符串' })
	desc?: string | null

	@Column({ type: 'text', nullable: true, comment: '封面' })
	@IsOptional()
	@IsString({ message: '封面必须为字符串' })
	@MaxLength(2048, { message: '封面路径最多2048个字符' })
	cover?: string | null

	@Column({ 
		type: 'enum', 
		default: CArticleStatus.DRAFT, 
		comment: '状态 (枚举: ' + Object.values(CArticleStatus).join(',') + ')',
		enum: Object.values(CArticleStatus)
	})
	@IsNotEmpty({ message: '状态不能为空' })
	@IsEnum(CArticleStatus, { message: '状态必须是有效的枚举值' })
	status!: ArticleStatus

	@Column({ name: 'isPrivate', type: 'boolean', default: false, comment: '是否私密' })
	@IsBoolean({ message: '是否私密必须是布尔值' })
	isPrivate!: boolean

	@Column({ name: 'isTop', type: 'boolean', default: false, comment: '是否置顶' })
	@IsBoolean({ message: '是否置顶必须是布尔值' })
	isTop!: boolean

	@Column({ type: 'varchar', length: 50, nullable: true, comment: '密码保护' })
	@IsOptional()
	@IsString({ message: '密码保护必须为字符串' })
	@MaxLength(50, { message: '密码保护最多50个字符' })
	protect?: string | null

	@Column({ name: 'commentCount', type: 'int', default: 0, comment: '评论数' })
	@IsInt({ message: '评论数必须为整数' })
	@Min(0, { message: '评论数不能小于0' })
	commentCount!: number

	@Column({ name: 'likeCount', type: 'int', default: 0, comment: '点赞数' })
	@IsInt({ message: '点赞数必须为整数' })
	@Min(0, { message: '点赞数不能小于0' })
	likeCount!: number

	@Column({ name: 'viewCount', type: 'int', default: 0, comment: '浏览数' })
	@IsInt({ message: '浏览数必须为整数' })
	@Min(0, { message: '浏览数不能小于0' })
	viewCount!: number

	@Column({ name: 'publishedAt', type: 'timestamp', comment: '发布时间' })
	@IsNotEmpty({ message: '发布时间不能为空' })
	@IsDateString({}, { message: '发布时间必须是日期字符串' })
	publishedAt!: Date
}
