import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { CTable } from '@u-blog/model'
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator'
import { Article } from './Article'
import { Comment } from './Comment'
import { Users } from './Users'
import { BaseSchema } from '../BaseSchema'

/**
 * 媒体表
 */
@Entity({ name: CTable.MEDIA, comment: '媒体表' })
@BaseSchema
export class Media {
	@PrimaryGeneratedColumn({ type: 'bigint', comment: '主键' })
	id!: number

	@Column({ type: 'varchar', length: 255, comment: '名称' })
	@IsNotEmpty({ message: '名称不能为空' })
	@IsString({ message: '名称必须为字符串' })
	@MaxLength(255, { message: '名称最多255个字符' })
	name!: string

	@Column({ name: 'originalName', type: 'varchar', length: 255, comment: '原始名称' })
	@IsNotEmpty({ message: '原始名称不能为空' })
	@IsString({ message: '原始名称必须为字符串' })
	@MaxLength(255, { message: '原始名称最多255个字符' })
	originalName!: string

	@Column({ type: 'varchar', length: 50, comment: '类型' })
	@IsNotEmpty({ message: '类型不能为空' })
	@IsString({ message: '类型必须为字符串' })
	@MaxLength(50, { message: '类型最多50个字符' })
	type!: string

	@Column({ name: 'mineType', type: 'varchar', length: 20, comment: '媒体类型' })
	@IsNotEmpty({ message: '媒体类型不能为空' })
	@IsString({ message: '媒体类型必须为字符串' })
	@MaxLength(20, { message: '媒体类型最多20个字符' })
	mineType!: string

	@Column({ type: 'varchar', length: 255, comment: '地址' })
	@IsNotEmpty({ message: '地址不能为空' })
	@IsString({ message: '地址必须为字符串' })
	@MaxLength(255, { message: '地址最多255个字符' })
	url!: string

	@Column({ type: 'varchar', length: 20, comment: '扩展名' })
	@IsNotEmpty({ message: '扩展名不能为空' })
	@IsString({ message: '扩展名必须为字符串' })
	@MaxLength(20, { message: '扩展名最多20个字符' })
	ext!: string

	@Column({ type: 'bigint', nullable: true, comment: '大小' })
	@IsOptional()
	@IsInt({ message: '大小必须为整数' })
	@Min(0, { message: '大小不能小于0' })
	size?: number | null

	@Column({ type: 'varchar', length: 255, comment: '哈希值' })
	@IsNotEmpty({ message: '哈希值不能为空' })
	@IsString({ message: '哈希值必须为字符串' })
	@MaxLength(255, { message: '哈希值最多255个字符' })
	hash!: string

	@Column({ type: 'varchar', length: 255, nullable: true, comment: '缩略图' })
	@IsOptional()
	@IsString({ message: '缩略图必须为字符串' })
	@MaxLength(255, { message: '缩略图路径最多255个字符' })
	thumbnail?: string | null

	@Column({ type: 'smallint', nullable: true, comment: '宽度' })
	@IsOptional()
	@IsInt({ message: '宽度必须为整数' })
	@Min(0, { message: '宽度不能小于0' })
	width?: number | null

	@Column({ type: 'smallint', nullable: true, comment: '高度' })
	@IsOptional()
	@IsInt({ message: '高度必须为整数' })
	@Min(0, { message: '高度不能小于0' })
	height?: number | null

	@Column({ type: 'int', nullable: true, comment: '时长' })
	@IsOptional()
	@IsInt({ message: '时长必须为整数' })
	@Min(0, { message: '时长不能小于0' })
	duration?: number | null

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

	@Column({ name: 'userId', type: 'int', nullable: true, comment: '用户id' })
	@IsOptional()
	@IsInt({ message: '用户ID必须为整数' })
	userId?: number | null

	@ManyToOne(() => Users)
	@JoinColumn({ name: 'userId' })
	user?: Users | null

}
