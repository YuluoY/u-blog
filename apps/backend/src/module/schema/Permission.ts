import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm'
import { CTable } from '@u-blog/model'
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

/**
 * 权限表
 */
@Entity({ name: CTable.PERMISSION, comment: '权限表' })
export class Permission {
	@PrimaryGeneratedColumn({ type: 'smallint', comment: '主键' })
	id!: number

	@Column({ type: 'varchar', length: 100, unique: true, comment: '权限名称' })
	@IsNotEmpty({ message: '权限名称不能为空' })
	@IsString({ message: '权限名称必须为字符串' })
	@MaxLength(100, { message: '权限名称最多100个字符' })
	name!: string

	@Column({ type: 'varchar', length: 100, unique: true, comment: '权限编码' })
	@IsNotEmpty({ message: '权限编码不能为空' })
	@IsString({ message: '权限编码必须为字符串' })
	@MaxLength(100, { message: '权限编码最多100个字符' })
	code!: string

	@Column({ type: 'varchar', length: 255, nullable: true, comment: '权限描述' })
	@IsOptional()
	@IsString({ message: '权限描述必须为字符串' })
	@MaxLength(255, { message: '权限描述最多255个字符' })
	desc?: string | null

	@Column({ type: 'varchar', length: 50, default: 'button', comment: '权限类型' })
	@IsNotEmpty({ message: '权限类型不能为空' })
	@IsString({ message: '权限类型必须为字符串' })
	@MaxLength(50, { message: '权限类型最多50个字符' })
	type!: string // button, menu, api

	@Column({ type: 'varchar', length: 100, nullable: true, comment: '资源标识' })
	@IsOptional()
	@IsString({ message: '资源标识必须为字符串' })
	@MaxLength(100, { message: '资源标识最多100个字符' })
	resource?: string | null

	@Column({ type: 'varchar', length: 50, nullable: true, comment: '操作类型' })
	@IsOptional()
	@IsString({ message: '操作类型必须为字符串' })
	@MaxLength(50, { message: '操作类型最多50个字符' })
	action?: string | null // create, read, update, delete

	@CreateDateColumn({ name: 'createdAt', type: 'timestamp', comment: '创建时间' })
	createdAt!: Date

	@UpdateDateColumn({ name: 'updatedAt', type: 'timestamp', comment: '更新时间' })
	updatedAt!: Date

	@DeleteDateColumn({ name: 'deletedAt', type: 'timestamp', nullable: true, comment: '删除时间' })
	deletedAt?: Date | null
}

