export const EmailRegExp =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
/**
 * 判断是否是Email
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-14
 * @param       {string}      email     - 要检查的Email
 * @return      {boolean}
 * @example
 * ```ts
 *  isEmail('123456789@qq.com') // true
 * ```
 */
export const isEmail = (email: string): boolean => EmailRegExp.test(email)