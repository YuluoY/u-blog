import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { CTable } from '@u-blog/model'
import { BaseSchema } from '../BaseSchema'
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

/**
 * 公告表 —— 用于站点横幅公告
 * 支持简短标题 + 可选 Markdown 详情
 */
@Entity({ name: CTable.ANNOUNCEMENT, comment: '公告表' })
@BaseSchema
export class Announcement {
  @PrimaryGeneratedColumn({ comment: '主键' })
  id!: number

  /** 公告简短标题（横幅上显示的文字） */
  @Column({ type: 'varchar', length: 255, comment: '公告标题' })
  @IsNotEmpty({ message: '公告标题不能为空' })
  @IsString()
  @MaxLength(255)
  title!: string

  /** 公告详情内容（Markdown 格式，为空则只展示横幅标题） */
  @Column({ type: 'text', nullable: true, comment: '详情内容（Markdown）' })
  @IsOptional()
  @IsString()
  content?: string | null

  /** 横幅背景色 */
  @Column({ type: 'varchar', length: 32, nullable: true, comment: '横幅背景色' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  bgColor?: string | null

  /** 横幅文字颜色 */
  @Column({ type: 'varchar', length: 32, nullable: true, comment: '横幅文字颜色' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  textColor?: string | null

  /** 是否启用 */
  @Column({ type: 'boolean', default: true, comment: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive!: boolean

  /** 排序权重（越大越靠前） */
  @Column({ type: 'int', default: 0, comment: '排序权重' })
  @IsOptional()
  @IsInt()
  sort!: number
}
