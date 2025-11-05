import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm'
import { CTable } from '@u-blog/model'
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { BaseSchema } from '../BaseSchema'
import { Permission } from './Permission'

/**
 * 角色表
 */
@Entity({ name: CTable.ROLE, comment: '角色表' })
@BaseSchema
export class Role {
	@PrimaryGeneratedColumn({ type: 'smallint', comment: '主键' })
	id!: number

	@Column({ 
		type: 'varchar',
		length: 50, 
		unique: true, 
		comment: '角色名称'
	})
	@IsNotEmpty({ message: '角色名称不能为空' })
	@IsString({ message: '角色名称必须为字符串' })
	@MaxLength(50, { message: '角色名称最多50个字符' })
	name!: string

	@Column({ type: 'varchar', length: 255, comment: '角色描述' })
	@IsNotEmpty({ message: '角色描述不能为空' })
	@IsString({ message: '角色描述必须为字符串' })
	@MaxLength(255, { message: '角色描述最多255个字符' })
	desc!: string

	// 使用多对多关系
  @ManyToMany(() => Permission)
  @JoinTable({
    name: CTable.ROLE_PERMISSION,  // 关联表名
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' }
  })
  permissions?: Permission[]
}

