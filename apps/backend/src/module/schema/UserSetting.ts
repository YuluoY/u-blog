import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm'
import { CTable } from '@u-blog/model'
import { BaseSchema } from '../BaseSchema'
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { Users } from './Users'

/**
 * 用户个人设置表
 * 存储用户级别的偏好配置（如 AI 模型 API Key、温度等），
 * 与全局 Setting 表分离，实现多用户隔离。
 * 唯一约束：(userId, key)
 */
@Entity({ name: CTable.USER_SETTING, comment: '用户个人设置表' })
@Unique(['userId', 'key'])
@BaseSchema
export class UserSetting {
	@PrimaryGeneratedColumn({ type: 'int', comment: '主键' })
	id!: number

	@Column({ type: 'int', comment: '用户ID' })
	@IsNotEmpty({ message: '用户ID不能为空' })
	@IsInt({ message: '用户ID必须为整数' })
	userId!: number

	@Column({ type: 'varchar', length: 100, comment: '设置键' })
	@IsNotEmpty({ message: '键不能为空' })
	@IsString({ message: '键必须为字符串' })
	@MaxLength(100, { message: '键最多100个字符' })
	key!: string

	@Column({ type: 'jsonb', comment: '设置值' })
	@IsNotEmpty({ message: '值不能为空' })
	value: any

	@Column({ type: 'varchar', length: 255, nullable: true, comment: '描述' })
	@IsOptional()
	@IsString({ message: '描述必须为字符串' })
	@MaxLength(255, { message: '描述最多255个字符' })
	desc!: string

	@ManyToOne(() => Users, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId' })
	user?: Users
}
