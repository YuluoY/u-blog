import type { Repository } from "typeorm";

class RestService {
  async query<T = any>(model: Repository<T>)
  {

  }
}

export default new RestService()