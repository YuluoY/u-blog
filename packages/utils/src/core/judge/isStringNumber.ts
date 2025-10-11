export const StringNumRegExp = /^\d+(\.\d+)?$/
/**
 * 判断是否是字符串数字
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-24
 * @param       {any}       str   - 要检查的值
 * @returns     {boolean}         - 如果是字符串数字返回 true，否则返回 false
 * @example
 * ```ts
 *  isStringNumber('123') // true
 *  isStringNumber('123.45') // true
 *  isStringNumber('abc') // false
 * ```
 */
export const isStringNumber = (str: any): str is boolean =>
{
  if (typeof str !== 'string')
    return false
  str = str.trim()
  if (!str)
    return false
  return StringNumRegExp.test(str)
}
