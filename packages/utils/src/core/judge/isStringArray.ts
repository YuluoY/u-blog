export const StringArrayRegExp = /^\[\d+(,\d+)*\]$/
/**
 * 判断是否是字符串数组
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-28
 * @param       {any}         str   - 要检查的值
 * @returns     {boolean}           - 如果是字符串数组返回 true，否则返回 false
 * @example
 * ```ts
 *  isStringArray('[1, 2, 3]') // true
 *  isStringArray('[]') // true
 *  isStringArray('123') // false
 * ```
 */
export const isStringArray = (str: any): str is boolean =>
{
  if (typeof str !== 'string' || !str)
    return false
  return StringArrayRegExp.test(str)
}