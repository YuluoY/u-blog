// BaseSchema.ts
import { IsDateString, IsOptional } from "class-validator"
import { CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from "typeorm"

export function BaseSchema<T extends new (...args: any[]) => {}>(constructor: T) {
  class Base extends constructor {
    @CreateDateColumn({ name: 'createdAt', type: 'timestamp', comment: '创建时间' })
    @IsDateString()
    createdAt!: Date

    @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp', comment: '更新时间' })
    @IsDateString()
    updatedAt!: Date

    @DeleteDateColumn({ name: 'deletedAt', type: 'timestamp', nullable: true, select: false, comment: '删除时间' })
    @IsDateString()
    @IsOptional()
    deletedAt?: Date | null
  }
  return Base as unknown as new (...args: ConstructorParameters<T>) => InstanceType<T> & IBaseSchema
}

export interface IBaseSchema {
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}