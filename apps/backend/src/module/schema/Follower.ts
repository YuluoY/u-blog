import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { CTable } from '@u-blog/model'
import { IsInt, IsNotEmpty } from 'class-validator'
import { Users } from './Users'
import { BaseSchema } from '../BaseSchema'

/**
 * 粉丝表
 */
@Entity({ name: CTable.FOLLOWER, comment: '粉丝表' })	
@BaseSchema
export class Follower {
	@PrimaryGeneratedColumn({ type: 'bigint', comment: '主键' })
	id!: number

	@Column({ name: 'followerId', type: 'int', comment: '粉丝id' })
	@IsNotEmpty({ message: '粉丝ID不能为空' })
	@IsInt({ message: '粉丝ID必须为整数' })
	followerId!: number

	@ManyToOne(() => Users)
	@JoinColumn({ name: 'followerId' })
	follower?: Users | null

	@Column({ name: 'followingId', type: 'int', comment: '关注id' })
	@IsNotEmpty({ message: '关注ID不能为空' })
	@IsInt({ message: '关注ID必须为整数' })
	followingId!: number

	@ManyToOne(() => Users)
	@JoinColumn({ name: 'followingId' })
	following?: Users | null
}
