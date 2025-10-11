/**
 * 获取cookie
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-08-02
 * @method      getCookie
 * @param       {string}        name      cookie存储的key值
 * @returns     {string}                  cookie的值
 */
export const getCookie = (name: string): string =>
{
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() as string
  return ''
}

/**
 * 设置cookie
 * @method      setCookie
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-08-02
 * @param       {string}                      name                cookie存储的key值
 * @param       {string}                      value               cookie的值
 * @param       {number}                      options.expires     过期时间，单位为天
 * @param       {string}                      options.path        cookie的路径
 * @param       {string}                      options.domain      cookie的域名
 * @param       {boolean}                     options.secure      是否使用https
 * @param       {'lax' | 'strict' | 'none'}   options.sameSite    是否使用同源策略
 * @returns     {void}
 * @example
 * ```js
 * setCookie("name", "value", { expires: 30, path: "/", domain: "example.com", secure: true, sameSite: "lax" });
 * ```
 */
export const setCookie = (
  name: string,
  value: string,
  options: {
    expires?: number
    path?: string
    domain?: string
    secure?: boolean
    sameSite?: 'lax' | 'strict' | 'none'
  }
): void =>
{
  let cookieText = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`
  options.expires = options.expires || 7 // 默认7天过期

  if (options.expires)
  {
    const d = new Date()
    d.setTime(d.getTime() + options.expires * 24 * 60 * 60 * 1000)
    cookieText += `; expires=${d.toUTCString()}`
  }
  if (options.path) cookieText += `; path=${options.path}`
  if (options.domain) cookieText += `; domain=${options.domain}`
  if (options.secure) cookieText += '; secure'
  if (options.sameSite) cookieText += `; samesite=${options.sameSite}`
  document.cookie = cookieText
}

/**
 * 删除cookie
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-08-02
 * @method      removeCookie
 * @param       {string}        name        cookie存储的key值
 * @param       {string}        path        cookie的路径
 * @param       {string}        domain      cookie的域名
 * @returns     {void}
 * @example
 * ```js
 * removeCookie("name", "/", "example.com");
 * ```
 */
export const removeCookie = (name: string, path?: string, domain?: string): void =>
{
  setCookie(name, '', { expires: -1, path, domain })
}

/**
 * 获取所有cookie
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-08-02
 * @method      getAllCookies
 * @returns     {Record<string, string>}  所有cookie的键值对
 */
export const getAllCookies = (): Record<string, string> =>
{
  const cookies: Record<string, string> = {}
  document.cookie.split(';').forEach(cookie =>
  {
    const [name, value] = cookie.split('=')
    cookies[name.trim()] = decodeURIComponent(value)
  })
  return cookies
}

/**
 * 验证cookie是否有效
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-08-02
 * @method      isCookieValid
 * @param       {string}          name    cookie存储的key值
 * @returns     {boolean}                 cookie是否有效
 */
export const isCookieValid = (name: string): boolean =>
{
  const cookieValue = getCookie(name)
  return !!cookieValue
}
