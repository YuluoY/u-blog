import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm'
import { CTable, UserRole, CUserRole } from '@u-blog/model'
import { IsBoolean, IsEmail, IsEnum, IsIP, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

/**
 * 用户表
 */
@Entity({ name: CTable.USER, comment: '用户表' })
export class Users {
	@PrimaryGeneratedColumn({ type: 'int', comment: '用户ID' })
	id!: number

	@Column({ type: 'varchar', length: 100, unique: true, nullable: false, comment: '用户名' })
	@IsNotEmpty({ message: '用户名不能为空' })
	@IsString({ message: '用户名必须为字符串' })
	@MaxLength(100, { message: '用户名最多100个字符' })
	@MinLength(3, { message: '用户名至少3个字符' })
	username!: string

	@Column({ type: 'varchar', length: 50, nullable: false, comment: '密码' })
	@IsNotEmpty({ message: '密码不能为空' })
	@IsString({ message: '密码必须为字符串' })
	@MaxLength(50, { message: '密码最多50个字符' })
	@MinLength(6, { message: '密码至少6个字符' })
	password!: string

	@Column({ type: 'varchar', unique: true, nullable: false, comment: '邮箱' })
	@IsNotEmpty({ message: '邮箱不能为空' })
	@IsEmail({}, { message: '邮箱格式不正确' })
	email!: string

	@Column({ type: 'varchar', length: 100, nullable: true, comment: '昵称' })
	@IsOptional()
	@IsString({ message: '昵称必须为字符串' })
	@MaxLength(100, { message: '昵称最多100个字符' })
	@MinLength(3, { message: '昵称至少3个字符' })
	namec?: string | null

	@Column({ type: 'varchar', length: 255, nullable: true, comment: '头像' })
	avatar?: string | null

	@Column({ type: 'text', nullable: true, comment: '个人简介' })
	bio?: string | null

	@Column({ 
		type: 'enum', 
		default: CUserRole.GUEST, 
		comment: '角色 (枚举: ' + Object.values(CUserRole).join(',') + ')',
		enum: Object.values(CUserRole)
	})
	@IsNotEmpty({ message: '角色不能为空' })
	@IsEnum(CUserRole, { message: '角色必须是枚举值', each: true })
	role!: UserRole

	@Column({ type: 'varchar', length: 255, nullable: true, comment: '所在地' })
	location?: string | null

	@Column({ type: 'varchar', length: 50, nullable: true, comment: '登录IP' })
	@IsOptional()
	@IsIP('4', { message: 'IP地址格式不正确' })
	ip?: string | null

	@Column({ type: 'jsonb', nullable: true, comment: '个人网站' })
	@IsOptional()
	@IsObject({ message: '个人网站必须是对象' })
	website?: object | null

	@Column({ type: 'jsonb', nullable: true, comment: '社交账号' })
	@IsOptional()
	@IsObject({ message: '社交账号必须是对象' })
	socials?: object | null

	@Column({ name: 'isActive', type: 'boolean', default: true, nullable: false, comment: '账号是否激活' })
	@IsBoolean({ message: '账号是否激活必须是布尔值' })
	isActive!: boolean

	@Column({ name: 'isVerified', type: 'boolean', default: false, nullable: false, comment: '邮箱是否验证' })
	@IsBoolean({ message: '邮箱是否验证必须是布尔值' })
	isVerified!: boolean

	@Column({ type: 'varchar', length: 255, nullable: true, comment: '签发访问令牌' })
	token?: string | null

	@Column({ type: 'varchar', length: 100, nullable: true, comment: '刷新令牌的随机字符串密钥' })
	rthash?: string | null

	@Column({ name: 'failLoginCount', type: 'int', default: 0, comment: '登录失败次数' })
	failLoginCount!: number

	@Column({ name: 'lockoutExpiresAt', type: 'timestamp', nullable: true, comment: '失败锁定过期时间' })
	lockoutExpiresAt?: Date | null

	@Column({ name: 'lastLoginAt', type: 'timestamp', comment: '最后登录时间' })
	lastLoginAt!: Date

	@CreateDateColumn({ name: 'createdAt', type: 'timestamp', comment: '创建时间' })
	createdAt!: Date

	@UpdateDateColumn({ name: 'updatedAt', type: 'timestamp', comment: '更新时间' })
	updatedAt!: Date

	@DeleteDateColumn({ name: 'deletedAt', type: 'timestamp', nullable: true, comment: '删除时间' })
	deletedAt?: Date | null
}

