import type { DeepPartial, Repository } from "typeorm"

class RestService {
  async query<T = any>(model: Repository<T>)
  {
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