import type { DeepPartial, Repository } from "typeorm"
import type { Request } from 'express'

class RestService {
  async query<T = any>(model: Repository<T>, req: Request)
  {
    const { where, take, skip, order } = req.body || {}
    
    // 获取实体元数据
    const metadata = model.metadata
    // 使用实体名称的小写作为别名
    const alias = metadata.name.toLowerCase()
    
    // 创建查询构建器，TypeORM 会自动处理软删除（deletedAt）
    const queryBuilder = model.createQueryBuilder(alias)
    
    // 处理 where 条件
    if (where && typeof where === 'object') {
      Object.keys(where).forEach(key => {
        // 查找对应的列
        const column = metadata.findColumnWithPropertyName(key)
        if (column) {
          // 使用数据库列名和参数化查询防止 SQL 注入
          const paramKey = `param_${key}`
          queryBuilder.andWhere(`${alias}.${column.databaseName} = :${paramKey}`, { [paramKey]: where[key] })
        } else {
          // 如果找不到列，尝试直接使用属性名（可能是数据库列名）
          const paramKey = `param_${key}`
          queryBuilder.andWhere(`${alias}.${key} = :${paramKey}`, { [paramKey]: where[key] })
        }
      })
    }
    
    // 处理排序
    if (order && typeof order === 'object') {
      Object.keys(order).forEach(key => {
        const column = metadata.findColumnWithPropertyName(key)
        if (column) {
          queryBuilder.addOrderBy(`${alias}.${column.databaseName}`, order[key] as 'ASC' | 'DESC')
        } else {
          // 如果找不到列，尝试直接使用属性名
          queryBuilder.addOrderBy(`${alias}.${key}`, order[key] as 'ASC' | 'DESC')
        }
      })
    }
    
    // 处理分页
    if (skip !== undefined && skip !== null && !isNaN(Number(skip))) {
      queryBuilder.skip(Number(skip))
    }
    
    if (take !== undefined && take !== null && !isNaN(Number(take))) {
      queryBuilder.take(Number(take))
    }
    
    const result = await queryBuilder.getMany()
    return result
  }

  async add<T extends DeepPartial<any>>(model: Repository<T>, data: T | T[], ret: number = 0)
  {
    const entity = model.create(data as T)
    const result = await model.save(entity) as any
    if (ret)
      return result
    return Array.isArray(result) ? result.map(v => ({ id: v.id })) : { id: result.id }
  }
}

export default new RestService()