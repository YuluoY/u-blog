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
    
    // 处理关联加载（如 category、tags、user、parent、parent.user 等嵌套）
    // 同一 alias 只 join 一次，避免 "table name specified more than once"
    if (Array.isArray(relations) && relations.length > 0) {
      const joinedAliases = new Set<string>()
      for (const relPath of relations) {
        const parts = String(relPath).split('.')
        const relName = parts[0]
        const relation = metadata.relations.find((r: { propertyName: string }) => r.propertyName === relName)
        if (!relation) continue
        if (parts.length === 1) {
          if (!joinedAliases.has(relName)) {
            queryBuilder.leftJoinAndSelect(`${alias}.${relName}`, relName)
            joinedAliases.add(relName)
          }
        } else {
          const subRel = parts.slice(1).join('.')
          const joinAlias = relPath.replace(/\./g, '_')
          if (!joinedAliases.has(relName)) {
            queryBuilder.leftJoinAndSelect(`${alias}.${relName}`, relName)
            joinedAliases.add(relName)
          }
          if (!joinedAliases.has(joinAlias)) {
            queryBuilder.leftJoinAndSelect(`${relName}.${subRel}`, joinAlias)
            joinedAliases.add(joinAlias)
          }
        }
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
    const isComment = model.metadata?.name === 'Comment'
    const raw = Array.isArray(data) ? (data as T[])[0] : (data as T)
    if (isComment && raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const r = raw as Record<string, unknown>
      Object.assign(entity, {
        ip: r.ip,
        userAgent: r.userAgent,
        browser: r.browser,
        device: r.device,
        ipLocation: r.ipLocation
      })
    }
    const result = await model.save(entity) as any
    if (ret)
      return result
    return Array.isArray(result) ? result.map(v => ({ id: v.id })) : { id: result.id }
  }

  /** 按 id 更新实体，body 中 id 必传，其余为要更新的字段 */
  async update<T>(model: Repository<T>, id: number, partial: DeepPartial<T>): Promise<T> {
    const existing = await model.findOne({ where: { id } as any })
    if (!existing) throw new Error('记录不存在')
    Object.assign(existing, partial)
    return model.save(existing) as Promise<T>
  }

  /** 按 id 软删除（有 deletedAt 的实体）或物理删除 */
  async del<T>(model: Repository<T>, id: number): Promise<void> {
    const meta = model.metadata
    const hasDeletedAt = meta.columns.some((c: { propertyName: string }) => c.propertyName === 'deletedAt')
    if (hasDeletedAt) {
      await model.softDelete(id)
    } else {
      await model.delete(id)
    }
  }
}

export default new RestService()