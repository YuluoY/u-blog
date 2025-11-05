import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm'
import { CTable } from '@u-blog/model'
import { BaseSchema } from '../BaseSchema'
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { Route } from './Route'
/**
 * 设置表
 */
@Entity({ name: CTable.SETTING, comment: '设置表' })
@BaseSchema
export class Setting {
	@PrimaryGeneratedColumn({ type: 'smallint', comment: '主键' })
	id!: number

	@Column({ type: 'varchar', length: 100, comment: '键' })
	@IsNotEmpty({ message: '键不能为空' })
	@IsString({ message: '键必须为字符串' })
	@MaxLength(100, { message: '键最多100个字符' })
	key!: string

	@Column({ type: 'jsonb', comment: '值' })
	@IsNotEmpty({ message: '值不能为空' })
	value: any

	@Column({ type: 'varchar', length: 255, nullable: true, comment: '描述' })
	@IsOptional()
	@IsString({ message: '描述必须为字符串' })
	@MaxLength(255, { message: '描述最多255个字符' })
	desc!: string


	@Column({ name: 'routeId', type: 'smallint', nullable: true, comment: '路由ID' })
	@IsOptional()
	@IsInt({ message: '路由ID必须为整数' })
	routeId?: number

	@ManyToOne(() => Route)
	@JoinColumn({ name: 'routeId' })
	route?: Route | null
}
