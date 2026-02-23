import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm'
import { CTable } from '@u-blog/model'
import { Users } from './Users'
import { BaseSchema } from '../BaseSchema'

/**
 * 用户行为日志表 — 全面追踪用户/游客的浏览、点击、搜索等操作
 */
@Entity({ name: CTable.ACTIVITY_LOG, comment: '用户行为日志表' })
@BaseSchema
export class ActivityLog {
	@PrimaryGeneratedColumn({ type: 'int', comment: '主键ID' })
	id!: number

	/** 事件类型：page_view / article_view / search / login / click 等 */
	@Column({ type: 'varchar', length: 30, comment: '事件类型' })
	@Index()
	type!: string

	/** 用户 ID（游客为 null） */
	@Column({ name: 'userId', type: 'int', nullable: true, comment: '用户ID' })
	@Index()
	userId?: number | null

	@ManyToOne(() => Users, { nullable: true })
	@JoinColumn({ name: 'userId' })
	user?: Users | null

	/** 前端生成的会话标识，用于串联同一次访问的多个事件 */
	@Column({ type: 'varchar', length: 64, nullable: true, comment: '会话ID' })
	@Index()
	sessionId?: string | null

	/** 客户端 IP */
	@Column({ type: 'varchar', length: 64, nullable: true, comment: 'IP地址' })
	@Index()
	ip?: string | null

	/** IP 地理位置（由后端解析） */
	@Column({ type: 'varchar', length: 200, nullable: true, comment: 'IP地理位置' })
	location?: string | null

	/** 浏览器信息 */
	@Column({ type: 'varchar', length: 100, nullable: true, comment: '浏览器' })
	browser?: string | null

	/** 设备类型 */
	@Column({ type: 'varchar', length: 30, nullable: true, comment: '设备类型' })
	device?: string | null

	/** 操作系统 */
	@Column({ type: 'varchar', length: 60, nullable: true, comment: '操作系统' })
	os?: string | null

	/** 访问路径 */
	@Column({ type: 'varchar', length: 500, nullable: true, comment: '访问路径' })
	@Index()
	path?: string | null

	/** 来源页面 */
	@Column({ type: 'varchar', length: 500, nullable: true, comment: '来源页面' })
	referer?: string | null

	/** 额外数据（JSON，如搜索关键词、文章 ID 等） */
	@Column({ type: 'text', nullable: true, comment: '额外数据JSON' })
	metadata?: string | null

	/** 页面停留时长（毫秒），仅 page_view 类型 */
	@Column({ type: 'int', nullable: true, comment: '停留时长(ms)' })
	duration?: number | null
}
