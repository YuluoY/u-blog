import api from '@/api'
import { CTable, type IUser, type IUserLoginDto, type IUserRegisterDto } from '@u-blog/model'
import { useState } from '@u-blog/composables'
import { defineStore } from 'pinia'
import { loginApi, registerApi, logoutApi, setAccessToken, sendEmailCodeApi, updateProfileApi } from '@/api/request'
import { useBlogOwnerStore } from '@/stores/blogOwner'
import { getUserBlogProfile, getSiteOwnerProfile, type UserBlogProfile } from '@/api/userBlog'

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
  const qryUser = () =>
  {
    if (_fetchPromise) return _fetchPromise
    _fetchPromise = _doFetchUser().finally(() =>
    {
      _fetchPromise = null
    })
    return _fetchPromise
  }

  const _doFetchUser = async() =>
  {
    const loggedIn = await api(CTable.USER).getUser()
    if (loggedIn)
    {
      setUser(loggedIn)
      setIsLoggedIn(true)
      setAuthReady(true)
      return
    }
    // 未登录：子域名模式使用博客拥有者信息，否则查站长信息用于侧栏展示
    setIsLoggedIn(false)
    try
    {
      const blogOwnerStore = useBlogOwnerStore()
      if (blogOwnerStore.isSubdomainMode && blogOwnerStore.profile?.user)
      {
        // 子域名模式：直接使用博客拥有者的资料
        setUser(blogOwnerStore.profile.user)
      }
      else
      {
        // 非子域名：查站长信息用于侧栏展示（公开接口，无需登录）
        const profile = await getSiteOwnerProfile()
        if (profile?.user)
        
          setUser(profile.user)
        
      }
    }
    catch
    { /* ignore */ }
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
    // 重新加载展示信息：子域名模式用博客拥有者，否则用站长
    try
    {
      const blogOwnerStore = useBlogOwnerStore()
      if (blogOwnerStore.isSubdomainMode && blogOwnerStore.profile?.user)
      
        setUser(blogOwnerStore.profile.user)
      
      else
      {
        const profile = await getSiteOwnerProfile()
        if (profile?.user)
        
          setUser(profile.user)
        
        else
        
          setUser({})
        
      }
    }
    catch
    {
      setUser({})
    }
  }

  /** 更新当前用户个人资料 */
  const updateProfile = async(data: Record<string, unknown>) =>
  {
    const updated = await updateProfileApi<Partial<IUser>>(data)
    // 合并更新后的字段到本地 user 状态
    if (updated)
    
      setUser({ ...user.value, ...updated })
    
    return updated
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
    updateProfile,
  }
})
