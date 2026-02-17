import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { CTable } from '@u-blog/model'
import { BaseSchema } from '../BaseSchema'
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator'

/**
 * 页面区块表（关于页等可配置区块）
 */
@Entity({ name: CTable.PAGE_BLOCK, comment: '页面区块表' })
@BaseSchema
export class PageBlock {
  @PrimaryGeneratedColumn({ type: 'int', comment: '主键' })
  id!: number

  @Column({ type: 'varchar', length: 50, comment: '页面标识，如 about' })
  @IsNotEmpty({ message: '页面标识不能为空' })
  @IsString()
  @MaxLength(50)
  page!: string

  @Column({ name: 'sortOrder', type: 'int', default: 0, comment: '排序，越小越靠前' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder!: number

  @Column({ type: 'varchar', length: 30, comment: '区块类型' })
  @IsNotEmpty({ message: '区块类型不能为空' })
  @IsString()
  @MaxLength(30)
  type!: string

  @Column({ type: 'varchar', length: 200, nullable: true, comment: '区块标题' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string | null

  @Column({ type: 'text', comment: '正文内容，支持 Markdown' })
  @IsNotEmpty({ message: '内容不能为空' })
  @IsString()
  content!: string

  @Column({ type: 'jsonb', nullable: true, comment: '扩展数据，如时间线条目' })
  @IsOptional()
  extra?: Record<string, unknown> | null
}
