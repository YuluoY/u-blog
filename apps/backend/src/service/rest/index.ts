import type { DeepPartial, Repository } from "typeorm"
import type { Request } from 'express'

class RestService {
  async query<T = any>(model: Repository<T>, req: Request)
  {
    const { where, take, skip, order, relations } = req.body || {}
    const metadata = model.metadata
    const alias = metadata.name.toLowerCase()
    
    // 创建查询构建器，TypeORM 会自动处理软删除（deletedAt）
    const queryBuilder = model.createQueryBuilder(alias)
    
    // 处理关联加载（如 category、tags、user）
    if (Array.isArray(relations) && relations.length > 0) {
      for (const relName of relations) {
        const relation = metadata.relations.find((r: { propertyName: string }) => r.propertyName === relName)
        if (relation) queryBuilder.leftJoinAndSelect(`${alias}.${relName}`, relName)
      }
    }
    
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
    
    // 处理排序（先排序再分页）
    if (order && typeof order === 'object') {
      const dir = (v: string) => (String(v).toUpperCase() === 'DESC' ? 'DESC' : 'ASC') as 'ASC' | 'DESC'
      Object.keys(order).forEach(key => {
        const orderDir = dir(order[key])
        let colName: string
        if (metadata.name === 'Article' && key === 'createdAt') {
          const col = metadata.findColumnWithPropertyName('createdAt')
          colName = col?.databaseName ?? 'createdAt'
        } else {
          const column = metadata.findColumnWithPropertyName(key)
          colName = column ? column.databaseName : key
        }
        queryBuilder.addOrderBy(`${alias}.${colName}`, orderDir)
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