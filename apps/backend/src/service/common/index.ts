import type { Repository } from 'typeorm'
import { Users } from '@/module/schema/Users'
import { IUserRegisterDto } from '@u-blog/model'

class CommonService {

  async register(
    userRepo: Repository<Users>,
    data: IUserRegisterDto,
    ret: number = 0
  )
  {

  }
}

export default new CommonService()