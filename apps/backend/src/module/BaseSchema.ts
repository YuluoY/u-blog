// BaseSchema.ts
import { IsDate, IsOptional } from "class-validator"
import { CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from "typeorm"

export function BaseSchema<T extends new (...args: any[]) => {}>(constructor: T) {
  class Base extends constructor {
    @CreateDateColumn({ 
      name: 'createdAt', 
      type: 'timestamp', 
      comment: '创建时间',
      default: () => 'CURRENT_TIMESTAMP'
    })
    @IsDate()
    @IsOptional()
    createdAt?: Date

    @UpdateDateColumn({ 
      name: 'updatedAt', 
      type: 'timestamp', 
      comment: '更新时间',
      default: () => 'CURRENT_TIMESTAMP',
      onUpdate: 'CURRENT_TIMESTAMP'
    })
    @IsDate()
    @IsOptional()
    updatedAt?: Date

    @DeleteDateColumn({ 
      name: 'deletedAt', 
      type: 'timestamp', 
      nullable: true, 
      select: false, 
      comment: '删除时间'
    })
    @IsDate()
    @IsOptional()
    deletedAt?: Date | null
  }
  
  // 确保原类的名称被保留
  Object.defineProperty(Base, 'name', { value: constructor.name })
  
  return Base as unknown as new (...args: ConstructorParameters<T>) => InstanceType<T> & IBaseSchema
}

export interface IBaseSchema {
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}