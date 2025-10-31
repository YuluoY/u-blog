import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { CTable } from '@u-blog/model'
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { Users } from './Users'

/**
 * 标签表
 */
@Entity({ name: CTable.TAG, comment: '标签表' })
export class Tag {
	@PrimaryGeneratedColumn({ type: 'smallint', comment: '主键' })
	id!: number

	@Column({ type: 'varchar', length: 50, comment: '标签名称' })
	@IsNotEmpty({ message: '标签名称不能为空' })
	@IsString({ message: '标签名称必须为字符串' })
	@MaxLength(50, { message: '标签名称最多50个字符' })
	name!: string

	@Column({ type: 'varchar', length: 255, nullable: true, comment: '标签描述' })
	@IsOptional()
	@IsString({ message: '标签描述必须为字符串' })
	@MaxLength(255, { message: '标签描述最多255个字符' })
	desc?: string | null

	@Column({ type: 'varchar', length: 50, nullable: true, comment: '标签颜色' })
	@IsOptional()
	@IsString({ message: '标签颜色必须为字符串' })
	@MaxLength(50, { message: '标签颜色最多50个字符' })
	color?: string | null

	@Column({ name: 'userId', type: 'int', nullable: true, comment: '用户id' })
	@IsOptional()
	@IsInt({ message: '用户ID必须为整数' })
	userId?: number | null

	@ManyToOne(() => Users)
	@JoinColumn({ name: 'userId' })
	user?: Users | null

	@CreateDateColumn({ name: 'createdAt', type: 'timestamp', comment: '创建时间' })
	createdAt!: Date

	@UpdateDateColumn({ name: 'updatedAt', type: 'timestamp', comment: '更新时间' })
	updatedAt!: Date

	@DeleteDateColumn({ name: 'deletedAt', type: 'timestamp', nullable: true, comment: '删除时间' })
	deletedAt?: Date | null
}

