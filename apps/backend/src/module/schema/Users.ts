import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { CTable, UserRole, CUserRole } from '@u-blog/model'
import { IsArray, IsBoolean, IsDate, IsDateString, IsEmail, IsEnum, IsInt, IsIP, IsNotEmpty, IsObject, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator'
import { BaseSchema } from '../BaseSchema'

/**
 * 用户表
 */
@Entity({ name: CTable.USER, comment: '用户表' })
@BaseSchema
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
	@IsOptional()
	@IsString({ message: '头像必须为字符串' })
	@MaxLength(255, { message: '头像最多255个字符' })
	avatar?: string | null

	@Column({ type: 'varchar', length: 255, nullable: true, comment: '个人简介' })
	@IsOptional()
	@IsString({ message: '个人简介必须为字符串' })
	@MaxLength(255, { message: '个人简介最多255个字符' })
	bio?: string | null

	@Column({ 
		type: 'enum', 
		default: CUserRole.GUEST, 
		comment: '角色 (枚举: ' + Object.values(CUserRole).join(',') + ')',
		enum: Object.values(CUserRole)
	})
	@IsNotEmpty({ message: '角色不能为空' })
	@IsEnum(CUserRole, { message: `角色必须是枚举值: ${Object.values(CUserRole).join(',')}`, each: true })
	role!: UserRole

	@Column({ type: 'varchar', length: 255, nullable: true, comment: '所在地' })
	location?: string | null

	@Column({ type: 'varchar', length: 100, nullable: true, comment: '登录IP' })
	@IsOptional()
	@IsIP(undefined, { message: 'IP地址格式不正确' })
	ip?: string | null

	@Column({ type: 'jsonb', nullable: true, comment: '个人网站' })
	@IsOptional()
	@IsObject({ message: '个人网站必须是对象' })
	website?: object | null

	@Column({ type: 'jsonb', nullable: true, comment: '社交账号' })
	@IsOptional()
	@IsArray({ message: '社交账号必须是数组' })
	@IsObject({ message: '社交账号数组中的每个元素必须是对象', each: true })
	socials?: object[] | null

	@Column({ name: 'isActive', select: false, type: 'boolean', default: true, nullable: false, comment: '账号是否激活' })
	@IsBoolean({ message: '账号是否激活必须是布尔值' })
	isActive!: boolean

	@Column({ type: 'varchar', length: 255, nullable: true, comment: '签发访问令牌' })
	token?: string | null

	@Column({ type: 'varchar', length: 100, select: false, nullable: true, comment: '刷新令牌的随机字符串密钥' })
	rthash?: string | null

	@Column({ name: 'failLoginCount', select: false, type: 'int', default: 0, comment: '登录失败次数' })
	@IsNotEmpty({ message: '登录失败次数不能为空' })
	@IsInt({ message: '登录失败次数必须是整数' })
	@Min(0, { message: '登录失败次数不能小于0' })
	@Max(5, { message: '登录失败次数不能大于5' })
	failLoginCount!: number

	@Column({ name: 'lockoutExpiresAt', select: false, type: 'timestamp', nullable: true, comment: '失败锁定过期时间' })
	@IsOptional()
	@IsDateString({}, { message: '失败锁定过期时间必须是日期字符串' })
	lockoutExpiresAt?: Date | null

	@Column({ name: 'lastLoginAt', select: false, type: 'timestamp', comment: '最后登录时间' })
	@IsOptional()
	@IsDateString({}, { message: '最后登录时间必须是日期字符串' })
	lastLoginAt!: Date
}

