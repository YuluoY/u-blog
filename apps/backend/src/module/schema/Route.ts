import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { CTable } from '@u-blog/model'
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

/**
 * 路由表
 */
@Entity({ name: CTable.ROUTE, comment: '路由表' })
export class Route {
	@PrimaryGeneratedColumn({ type: 'smallint', comment: '主键' })
	id!: number

	@Column({ type: 'varchar', length: 50, nullable: true, comment: '路由标题' })
	@IsOptional()
	@IsString({ message: '路由标题必须为字符串' })
	@MaxLength(50, { message: '路由标题最多50个字符' })
	title?: string | null

	@Column({ type: 'varchar', length: 50, unique: true, comment: '路由名称' })
	@IsNotEmpty({ message: '路由名称不能为空' })
	@IsString({ message: '路由名称必须为字符串' })
	@MaxLength(50, { message: '路由名称最多50个字符' })
	name!: string

	@Column({ type: 'varchar', length: 255, unique: true, comment: '路由路径' })
	@IsNotEmpty({ message: '路由路径不能为空' })
	@IsString({ message: '路由路径必须为字符串' })
	@MaxLength(255, { message: '路由路径最多255个字符' })
	path!: string

	@Column({ type: 'varchar', length: 255, nullable: true, comment: '组件路径' })
	@IsOptional()
	@IsString({ message: '组件路径必须为字符串' })
	@MaxLength(255, { message: '组件路径最多255个字符' })
	component?: string | null

	@Column({ type: 'varchar', length: 100, nullable: true, comment: '重定向路径' })
	@IsOptional()
	@IsString({ message: '重定向路径必须为字符串' })
	@MaxLength(100, { message: '重定向路径最多100个字符' })
	redirect?: string | null

	@Column({ type: 'varchar', length: 100, nullable: true, comment: '图标' })
	@IsOptional()
	@IsString({ message: '图标必须为字符串' })
	@MaxLength(100, { message: '图标最多100个字符' })
	icon?: string | null

	@Column({ name: 'isKeepAlive', type: 'boolean', default: false, comment: '是否缓存' })
	@IsBoolean({ message: '是否缓存必须是布尔值' })
	isKeepAlive!: boolean

	@Column({ name: 'isAffix', type: 'boolean', default: false, comment: '是否固定' })
	@IsBoolean({ message: '是否固定必须是布尔值' })
	isAffix!: boolean

	@Column({ name: 'isExact', type: 'boolean', default: false, comment: '是否精确匹配' })
	@IsBoolean({ message: '是否精确匹配必须是布尔值' })
	isExact!: boolean

	@Column({ name: 'isProtected', type: 'boolean', default: false, comment: '是否需要鉴权' })
	@IsBoolean({ message: '是否需要鉴权必须是布尔值' })
	isProtected!: boolean

	@Column({ name: 'isHero', type: 'boolean', default: false, comment: '是否显示Hero封面' })
	@IsBoolean({ message: '是否显示Hero封面必须是布尔值' })
	isHero!: boolean

	@Column({ name: 'isLeftSide', type: 'boolean', default: false, comment: '是否显示左侧信息' })
	@IsBoolean({ message: '是否显示左侧信息必须是布尔值' })
	isLeftSide!: boolean

	@Column({ name: 'isRightSide', type: 'boolean', default: false, comment: '是否显示右侧信息' })
	@IsBoolean({ message: '是否显示右侧信息必须是布尔值' })
	isRightSide!: boolean

	@Column({ type: 'smallint', nullable: true, comment: '父级路由ID' })
	@IsOptional()
	@IsInt({ message: '父级路由ID必须为整数' })
	pid?: number | null

	@ManyToOne(() => Route)
	@JoinColumn({ name: 'pid' })
	parent?: Route | null

	@CreateDateColumn({ name: 'createdAt', type: 'timestamp', comment: '创建时间' })
	createdAt!: Date

	@UpdateDateColumn({ name: 'updatedAt', type: 'timestamp', comment: '更新时间' })
	updatedAt!: Date

	@DeleteDateColumn({ name: 'deletedAt', type: 'timestamp', nullable: true, comment: '删除时间' })
	deletedAt?: Date | null
}
