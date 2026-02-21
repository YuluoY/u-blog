import api from '@/api'
import { CTable, type IUser, type IUserLoginDto, type IUserRegisterDto } from '@u-blog/model'
import { useState } from '@u-blog/composables'
import { defineStore } from 'pinia'
import { restQuery, loginApi, registerApi, logoutApi, setAccessToken, sendEmailCodeApi } from '@/api/request'

export const useUserStore = defineStore('user', () =>
{
  const [user, setUser] = useState<Partial<IUser>>({})
  /** 是否已通过认证（区别于 user 可能是站长回退信息） */
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  /** 初始化是否完成（路由守卫等待此标记） */
  const [authReady, setAuthReady] = useState(false)

  /** 避免并发请求：缓存进行中的 fetchUser Promise */
  let _fetchPromise: Promise<void> | null = null

  /**
   * 获取当前用户（通过 refresh token）；
   * 若未登录，回退查询第一个 super_admin 作为站长展示信息。
   * 内置去重：多处同时调用只会发出一次请求。
   */
  const qryUser = () => {
    if (_fetchPromise) return _fetchPromise
    _fetchPromise = _doFetchUser().finally(() => { _fetchPromise = null })
    return _fetchPromise
  }

  const _doFetchUser = async() =>
  {
    const loggedIn = await api(CTable.USER).getUser()
    if (loggedIn) {
      setUser(loggedIn)
      setIsLoggedIn(true)
      setAuthReady(true)
      return
    }
    // 未登录：查站长信息用于侧栏展示
    setIsLoggedIn(false)
    try {
      const list = await restQuery<Partial<IUser>[]>('users', {
        where: { role: 'super_admin' },
        take: 1
      })
      if (Array.isArray(list) && list[0]) {
        setUser(list[0])
      }
    } catch { /* ignore */ }
    setAuthReady(true)
  }

  /** 用户登录 */
  const login = async(data: IUserLoginDto) =>
  {
    const result = await loginApi(data)
    setUser(result)
    setIsLoggedIn(true)
    return result
  }

  /** 用户注册（含邮箱验证码） */
  const register = async(data: IUserRegisterDto & { emailCode: string }) =>
  {
    const result = await registerApi(data)
    setUser(result)
    setIsLoggedIn(true)
    return result
  }

  /** 发送邮箱验证码 */
  const sendEmailCode = async(email: string) =>
  {
    await sendEmailCodeApi(email)
  }

  /** 用户登出 */
  const logout = async() =>
  {
    await logoutApi()
    setIsLoggedIn(false)
    setAccessToken(null)
    // 重新加载站长信息
    try {
      const list = await restQuery<Partial<IUser>[]>('users', {
        where: { role: 'super_admin' },
        take: 1
      })
      if (Array.isArray(list) && list[0]) {
        setUser(list[0])
      } else {
        setUser({})
      }
    } catch {
      setUser({})
    }
  }

  return {
    user,
    setUser,
    isLoggedIn,
    authReady,
    fetchUser: qryUser,
    login,
    register,
    logout,
    sendEmailCode,
  }
})
