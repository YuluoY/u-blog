import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { BaseSchema } from '../BaseSchema'
import { IsNotEmpty, IsOptional, IsString, IsInt, MaxLength } from 'class-validator'
import { Users } from './Users'

/** 小惠对话消息结构 */
export interface IXiaohuiMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

/**
 * 小惠 AI 助手对话日志表
 * 记录所有通过 小惠 页面发起的对话，用于管理后台审计
 */
@Entity({ name: 'xiaohui_conversation', comment: '小惠对话日志' })
@BaseSchema
export class XiaohuiConversation {
  @PrimaryGeneratedColumn({ comment: '主键' })
  id!: number

  /** 会话唯一标识（前端生成 UUID，同一次连续对话共享） */
  @Column({ type: 'varchar', length: 64, comment: '会话ID' })
  @IsNotEmpty({ message: '会话ID不能为空' })
  @IsString()
  @MaxLength(64)
  sessionId!: string

  /** 关联的已登录用户（游客为 null） */
  @Column({ name: 'userId', type: 'int', nullable: true, comment: '用户ID（游客为空）' })
  @IsOptional()
  @IsInt()
  userId?: number | null

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: Users | null

  /** 游客 IP（已登录用户也记录） */
  @Column({ type: 'varchar', length: 64, nullable: true, comment: '客户端IP' })
  @IsOptional()
  @IsString()
  clientIp?: string | null

  /** 用户发送的消息 */
  @Column({ type: 'text', comment: '用户消息' })
  @IsNotEmpty({ message: '用户消息不能为空' })
  @IsString()
  userMessage!: string

  /** AI 回复的完整消息 */
  @Column({ type: 'text', nullable: true, comment: 'AI回复' })
  @IsOptional()
  @IsString()
  assistantMessage?: string | null

  /** 完整的对话上下文（JSON 数组，多轮对话） */
  @Column({ type: 'jsonb', nullable: true, comment: '对话上下文' })
  @IsOptional()
  context?: IXiaohuiMessage[] | null

  /** 响应耗时（毫秒） */
  @Column({ type: 'int', nullable: true, comment: '响应耗时(ms)' })
  @IsOptional()
  @IsInt()
  latencyMs?: number | null

  /** 状态：success / error / aborted */
  @Column({ type: 'varchar', length: 20, default: 'success', comment: '状态' })
  @IsOptional()
  @IsString()
  status?: string
}
