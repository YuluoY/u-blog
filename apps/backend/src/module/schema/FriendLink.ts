import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { CTable, CFriendLinkStatus } from '@u-blog/model'
import { BaseSchema } from '../BaseSchema'
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator'
import { Users } from './Users'

/**
 * 友情链接实体
 * 支持访客提交友链申请 → 博主审核通过/拒绝
 */
@Entity({ name: CTable.FRIEND_LINK, comment: '友情链接表' })
@BaseSchema
export class FriendLink {
  @PrimaryGeneratedColumn({ type: 'int', comment: '主键' })
  id!: number

  /** 所属博主用户 ID */
  @Column({ type: 'int', comment: '所属博主用户ID' })
  @IsNotEmpty({ message: '用户ID不能为空' })
  @IsInt({ message: '用户ID必须为整数' })
  userId!: number

  /** 友链网站 URL */
  @Column({ type: 'varchar', length: 500, comment: '网站URL' })
  @IsNotEmpty({ message: 'URL不能为空' })
  @IsUrl({}, { message: 'URL格式不正确' })
  @MaxLength(500, { message: 'URL最多500个字符' })
  url!: string

  /** 网站标题 */
  @Column({ type: 'varchar', length: 200, comment: '网站标题' })
  @IsNotEmpty({ message: '标题不能为空' })
  @IsString({ message: '标题必须为字符串' })
  @MaxLength(200, { message: '标题最多200个字符' })
  title!: string

  /** 网站图标 URL */
  @Column({ type: 'varchar', length: 500, nullable: true, comment: '网站图标URL' })
  @IsOptional()
  @MaxLength(500, { message: '图标URL最多500个字符' })
  icon?: string

  /** 简介描述 */
  @Column({ type: 'varchar', length: 500, nullable: true, comment: '简介描述' })
  @IsOptional()
  @IsString({ message: '描述必须为字符串' })
  @MaxLength(500, { message: '描述最多500个字符' })
  description?: string

  /** 申请人邮箱 */
  @Column({ type: 'varchar', length: 200, nullable: true, comment: '申请人邮箱' })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  @MaxLength(200, { message: '邮箱最多200个字符' })
  email?: string

  /** 审核状态 */
  @Column({
    type: 'varchar',
    length: 20,
    default: CFriendLinkStatus.PENDING,
    comment: '审核状态: pending/approved/rejected'
  })
  @IsString()
  status!: string

  /** 排序权重 */
  @Column({ type: 'int', default: 0, comment: '排序权重（越大越靠前）' })
  @IsOptional()
  @IsInt({ message: '排序权重必须为整数' })
  sortOrder!: number

  /** 所属博主 */
  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: Users
}
