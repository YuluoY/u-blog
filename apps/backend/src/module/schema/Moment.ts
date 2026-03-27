import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { CTable } from '@u-blog/model'
import { BaseSchema } from '../BaseSchema'
import { Users } from './Users'
import {
  IsBoolean, IsInt, IsNotEmpty, IsOptional,
  IsString, IsArray, IsIn, MaxLength,
} from 'class-validator'

/**
 * 动态表 —— 博主发布的短内容流
 *
 * 支持 Markdown 正文 + 可选图片（多种展示模式）+ 心情/标签/天气附加字段。
 * 公开动态对所有用户（含游客）可见；私密动态仅博主可见。
 */
@Entity({ name: CTable.MOMENT, comment: '动态表' })
@BaseSchema
export class Moment {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '主键' })
  id!: number

  /** 发布者 ID */
  @Column({ name: 'userId', type: 'int', comment: '发布者 ID' })
  @IsNotEmpty({ message: '发布者 ID 不能为空' })
  @IsInt({ message: '发布者 ID 必须为整数' })
  userId!: number

  @ManyToOne(() => Users)
  @JoinColumn({ name: 'userId' })
  user?: Users

  /** 动态正文（Markdown 格式） */
  @Column({ type: 'text', comment: '动态正文（Markdown）' })
  @IsNotEmpty({ message: '动态内容不能为空' })
  @IsString({ message: '动态内容必须为字符串' })
  content!: string

  /** 图片 URL 列表，JSON 数组存储 */
  @Column({ type: 'simple-json', nullable: true, comment: '图片 URL 列表' })
  @IsOptional()
  @IsArray({ message: '图片列表必须为数组' })
  images?: string[] | null

  /** 图片展示布局：grid（九宫格）/ long（合成长图）/ scroll（横向滚动） */
  @Column({ name: 'imageLayout', type: 'varchar', length: 20, nullable: true, comment: '图片展示布局' })
  @IsOptional()
  @IsIn(['grid', 'long', 'scroll'], { message: '图片布局仅支持 grid / long / scroll' })
  imageLayout?: string | null

  /** 心情 emoji（可选） */
  @Column({ type: 'varchar', length: 50, nullable: true, comment: '心情 emoji' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  mood?: string | null

  /** 标签列表，JSON 数组存储 */
  @Column({ type: 'simple-json', nullable: true, comment: '标签列表' })
  @IsOptional()
  @IsArray({ message: '标签必须为数组' })
  tags?: string[] | null

  /** 天气信息（手动选择或 IP 自动获取） */
  @Column({ type: 'varchar', length: 50, nullable: true, comment: '天气信息' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  weather?: string | null

  /** 可见性：public / private */
  @Column({ type: 'varchar', length: 10, default: 'public', comment: '可见性' })
  @IsOptional()
  @IsIn(['public', 'private'], { message: '可见性仅支持 public / private' })
  visibility!: string

  /** 是否置顶 */
  @Column({ name: 'isPinned', type: 'boolean', default: false, comment: '是否置顶' })
  @IsOptional()
  @IsBoolean()
  isPinned!: boolean

  /** 点赞数 */
  @Column({ name: 'likeCount', type: 'int', default: 0, comment: '点赞数' })
  @IsOptional()
  @IsInt()
  likeCount!: number

  /** 评论数 */
  @Column({ name: 'commentCount', type: 'int', default: 0, comment: '评论数' })
  @IsOptional()
  @IsInt()
  commentCount!: number
}
