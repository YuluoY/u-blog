import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm'
import { CTable, CPermission, Permission, PermissionAction, CPermissionAction } from '@u-blog/model'
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { BaseSchema } from '../BaseSchema'
import { Role } from './Role'

/**
 * 权限表
 */
@Entity({ name: CTable.PERMISSION, comment: '权限表' })
@BaseSchema
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

	@Column({ 
		type: 'varchar', 
		length: 50, 
		comment: '权限类型',
		enum: Object.values(CPermission)
	})
	@IsNotEmpty({ message: '权限类型不能为空' })
	@IsEnum(CPermission, { message: '权限类型必须是有效的枚举值' })
	@MaxLength(50, { message: '权限类型最多50个字符' })
	type!: Permission

	@Column({ type: 'varchar', length: 100, nullable: true, comment: '资源标识' })
	@IsOptional()
	@IsString({ message: '资源标识必须为字符串' })
	@MaxLength(100, { message: '资源标识最多100个字符' })
	resource?: string | null

	@Column({ 
		type: 'varchar', 
		length: 50, 
		comment: '操作类型',
		enum: Object.values(CPermissionAction)
	})
	@IsNotEmpty({ message: '操作类型不能为空' })
	@IsEnum(CPermissionAction, { message: '操作类型必须是有效的枚举值' })
	@MaxLength(50, { message: '操作类型最多50个字符' })
	action: PermissionAction

	@ManyToMany(() => Role, role => role.permissions)
	@IsOptional()
	roles?: Role[] | null
}

