import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { CTable } from '@u-blog/model'
import { IsInt, IsIP, IsOptional, IsString, MaxLength } from 'class-validator'
import { Users } from './Users'
import { Article } from './Article'
import { Route } from './Route'
import { BaseSchema } from '../BaseSchema'
/**
 * 访问表
 */
@Entity({ name: CTable.VIEW, comment: '访问表' })
@BaseSchema
export class View {
	@PrimaryGeneratedColumn({ type: 'bigint', comment: '主键' })
	id!: number

	@Column({ type: 'varchar', length: 100, nullable: true, comment: 'ip地址' })
	@IsOptional()
	@IsIP(undefined, { message: 'IP地址格式不正确' })
	ip?: string | null

	@Column({ type: 'varchar', length: 255, nullable: true, comment: '访问者浏览器' })
	@IsOptional()
	@IsString({ message: '访问者浏览器必须为字符串' })
	@MaxLength(255, { message: '访问者浏览器最多255个字符' })
	agent?: string | null

	@Column({ type: 'varchar', length: 255, nullable: true, comment: '访问者地址' })
	@IsOptional()
	@IsString({ message: '访问者地址必须为字符串' })
	@MaxLength(255, { message: '访问者地址最多255个字符' })
	address?: string | null

	@Column({ name: 'userId', type: 'int', nullable: true, comment: '访问者id' })
	@IsOptional()
	@IsInt({ message: '访问者ID必须为整数' })
	userId?: number | null

	@ManyToOne(() => Users)
	@JoinColumn({ name: 'userId' })
	user?: Users | null

	@Column({ name: 'articleId', type: 'int', nullable: true, comment: '文章id' })
	@IsOptional()
	@IsInt({ message: '文章ID必须为整数' })
	articleId?: number | null

	@ManyToOne(() => Article)
	@JoinColumn({ name: 'articleId' })
	article?: Article | null

	@Column({ name: 'routeId', type: 'smallint', nullable: true, comment: '路由id' })
	@IsOptional()
	@IsInt({ message: '路由ID必须为整数' })
	routeId?: number | null

	@ManyToOne(() => Route)
	@JoinColumn({ name: 'routeId' })
	route?: Route | null

}
