import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Unique } from 'typeorm'
import { CTable } from '@u-blog/model'
import { CUserRole, UserRole } from '@u-blog/model'
import { IsEnum, IsInt, IsNotEmpty } from 'class-validator'

/**
 * 角色权限关联表
 */
@Entity({ name: CTable.ROLE_PERMISSION, comment: '角色权限关联表' })
@Unique(['roleName', 'permissionId'])
export class RolePermission {
	@PrimaryGeneratedColumn({ type: 'smallint', comment: '主键' })
	id!: number

	@Column({ 
		name: 'roleName', 
		type: 'enum', 
		comment: '角色名称',
		enum: Object.values(CUserRole)
	})
	@IsNotEmpty({ message: '角色名称不能为空' })
	@IsEnum(CUserRole, { message: '角色名称必须是有效的枚举值' })
	roleName!: UserRole

	@Column({ name: 'permissionId', type: 'smallint', comment: '权限ID' })
	@IsNotEmpty({ message: '权限ID不能为空' })
	@IsInt({ message: '权限ID必须为整数' })
	permissionId!: number
	
	@CreateDateColumn({ name: 'createdAt', type: 'timestamp', comment: '创建时间' })
	createdAt!: Date

	@UpdateDateColumn({ name: 'updatedAt', type: 'timestamp', comment: '更新时间' })
	updatedAt!: Date

	@DeleteDateColumn({ name: 'deletedAt', type: 'timestamp', nullable: true, comment: '删除时间' })
	deletedAt?: Date | null
}

