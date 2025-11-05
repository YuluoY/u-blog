import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { CTable } from '@u-blog/model'
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { Users } from './Users'
import { BaseSchema } from '../BaseSchema'

/**
 * 分类表
 */
@Entity({ name: CTable.CATEGORY, comment: '分类表' })
@BaseSchema
export class Category {
	@PrimaryGeneratedColumn({ type: 'smallint', comment: '主键' })
	id!: number

	@Column({ type: 'varchar', length: 50, unique: true, comment: '分类名称' })
	@IsNotEmpty({ message: '分类名称不能为空' })
	@IsString({ message: '分类名称必须为字符串' })
	@MaxLength(50, { message: '分类名称最多50个字符' })
	name!: string

	@Column({ type: 'varchar', length: 255, nullable: true, comment: '分类描述' })
	@IsOptional()
	@IsString({ message: '分类描述必须为字符串' })
	@MaxLength(255, { message: '分类描述最多255个字符' })
	desc?: string | null

	@Column({ name: 'userId', type: 'int', nullable: true, comment: '用户id' })
	@IsOptional()
	@IsInt({ message: '用户ID必须为整数' })
	userId?: number | null

	@ManyToOne(() => Users)
	@JoinColumn({ name: 'userId' })
	user?: Users | null
}

