import api from '@/api'
import { CTable, type IUser } from '@u-blog/model'
import { useState } from '@u-blog/composables'
import { defineStore } from 'pinia'
import { restQuery } from '@/api/request'

export const useUserStore = defineStore('user', () =>
{
  const [user, setUser] = useState<Partial<IUser>>({})

  /**
   * 获取当前用户（通过 refresh token）；
   * 若未登录，回退查询第一个 super_admin 作为站长展示信息。
   */
  const qryUser = async() =>
  {
    const loggedIn = await api(CTable.USER).getUser()
    if (loggedIn) {
      setUser(loggedIn)
      return
    }
    // 未登录：查站长信息用于侧栏展示
    try {
      const list = await restQuery<Partial<IUser>[]>('users', {
        where: { role: 'super_admin' },
        take: 1
      })
      if (Array.isArray(list) && list[0]) {
        setUser(list[0])
      }
    } catch { /* ignore */ }
  }

  return {
    user,
    setUser,
    fetchUser: qryUser
  }
})
