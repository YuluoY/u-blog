import type { IUser } from '@u-blog/model'
import type { ApiMethod } from './types'
import request, { setAccessToken } from './request'

export interface IUserApis {
  [keyof: string]: ApiMethod
  getUser: () => Promise<IUser | null>
}

const apis: IUserApis = {
  async getUser() {
    try {
      const res = await request.post<{ code: number; data: IUser; message: string }>('/refresh', {}, { withCredentials: true })
      if (res.data?.code === 0 && res.data?.data) {
        // 恢复 access token 到内存
        if (res.data.data.token) {
          setAccessToken(res.data.data.token)
        }
        return res.data.data
      }
      return null
    } catch {
      return null
    }
  }
}

export default apis
