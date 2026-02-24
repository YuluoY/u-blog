import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'
import { CTable } from '@u-blog/model'
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { BaseSchema } from '../BaseSchema'

/** 邮件订阅者实体 */
@Entity({ name: CTable.SUBSCRIBER, comment: '邮件订阅者表' })
@BaseSchema
export class Subscriber {
  @PrimaryGeneratedColumn({ type: 'int', comment: '主键' })
  id!: number

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false, comment: '订阅邮箱' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email!: string

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '订阅者昵称' })
  @IsOptional()
  @IsString({ message: '昵称必须为字符串' })
  @MaxLength(100, { message: '昵称最多100个字符' })
  name?: string | null

  @Column({ type: 'varchar', length: 128, nullable: false, comment: '验证/退订令牌' })
  @IsString()
  token!: string

  @Column({
    type: 'enum',
    enum: ['pending', 'active', 'unsubscribed'],
    default: 'pending',
    comment: '订阅状态：pending=待验证 active=已生效 unsubscribed=已退订',
  })
  @Index()
  status!: string
}
