import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { CTable } from '@u-blog/model'
import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator'
import { Users } from './Users'
import { BaseSchema } from '../BaseSchema'

/**
 * 操作日志表
 */
@Entity({ name: CTable.ACTIVITY_LOG, comment: '操作日志表' })
@BaseSchema
export class ActivityLog {
	@PrimaryGeneratedColumn({ type: 'int', comment: '主键ID' })
	id!: number

	@Column({ name: 'userId', type: 'int', comment: '用户ID' })
	@IsNotEmpty({ message: '用户ID不能为空' })
	@IsInt({ message: '用户ID必须为整数' })
	userId!: number

	@ManyToOne(() => Users)
	@JoinColumn({ name: 'userId' })
	user?: Users | null

	@Column({ type: 'varchar', length: 255, comment: '操作' })
	@IsNotEmpty({ message: '操作不能为空' })
	@IsString({ message: '操作必须为字符串' })
	@MaxLength(255, { message: '操作最多255个字符' })
	action!: string
}
