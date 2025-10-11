/**
 * 获取localStorage的值
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-08-02
 * @method      getLocalStorage
 * @param       {string}            key       localStorage的key
 * @returns     {any}                         localStorage的值
 */
export const getLocalStorage = <T = any>(key: string): T | null =>
{
  const value = localStorage.getItem(key)
  if (!value) return null

  const obj = JSON.parse(value)
  const { expires, value: val } = obj
  const nowTime = new Date().getTime()
  if (nowTime > new Date(expires).getTime())
  {
    localStorage.removeItem(key)
    return null
  }
  return val
}

/**
 * 设置localStorage的值
 * @author        Yuluo
 * @link          https://github.com/YuluoY
 * @date          2024-08-02
 * @method        setLocalStorage
 * @param         {string}          key                 localStorage的key
 * @param         {any}             value               localStorage的值
 * @param         {object}          options             配置项
 * @param         {number}          options.expires     过期时间，单位：天
 * @returns       {void}
 */
export const setLocalStorage = (
  key: string,
  value: any,
  {
    expires = 7 // 过期时间，单位：天
  }
): void =>
{
  const expiresTime = new Date().getTime() + expires * 24 * 60 * 60 * 1000
  const expiresStr = new Date(expiresTime).toUTCString()
  const obj = {
    value,
    expires: expiresStr
  }
  localStorage.setItem(key, JSON.stringify(obj))
}

/**
 * 删除localStorage的值
 * @author        Yuluo
 * @link          https://github.com/YuluoY
 * @date          2024-08-02
 * @method        removeLocalStorage
 * @param         {string}            key         localStorage的key
 * @returns       {void}
 */
export const removeLocalStorage = (key: string): void =>
{
  localStorage.removeItem(key)
}
