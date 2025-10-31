import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm'
import { CTable, UserRole, CUserRole } from '@u-blog/model'
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator'

/**
 * 角色表
 */
@Entity({ name: CTable.ROLE, comment: '角色表' })
export class Role {
	@PrimaryGeneratedColumn({ type: 'smallint', comment: '主键' })
	id!: number

	@Column({ 
		type: 'varchar',
		length: 50, 
		unique: true, 
		comment: '角色名称 (枚举: user_role)'
	})
	@IsNotEmpty({ message: '角色名称不能为空' })
	@IsEnum(CUserRole, { message: '角色名称必须是有效的枚举值' })
	name!: UserRole

	@Column({ type: 'varchar', length: 255, comment: '角色描述' })
	@IsNotEmpty({ message: '角色描述不能为空' })
	@IsString({ message: '角色描述必须为字符串' })
	@MaxLength(255, { message: '角色描述最多255个字符' })
	desc!: string

	@CreateDateColumn({ name: 'createdAt', type: 'timestamp', comment: '创建时间' })
	createdAt!: Date

	@UpdateDateColumn({ name: 'updatedAt', type: 'timestamp', comment: '更新时间' })
	updatedAt!: Date

	@DeleteDateColumn({ name: 'deletedAt', type: 'timestamp', nullable: true, comment: '删除时间' })
	deletedAt?: Date | null
}

