import api from '@/api'
import { CTables, type IUser } from '@u-blog/model'
import { useState } from '@u-blog/composables'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () =>
{
  const [user, setUser] = useState<Partial<IUser>>({})

  const qryUser = async() =>
  {
    const user = await api(CTables.USER).getUser()
    setUser(user)
  }

  onBeforeMount(() =>
  {
    qryUser()
  })

  return {
    user,
    setUser
  }
})