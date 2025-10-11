export const StringBooleanRegExp = /^(true|false)$/
/**
 * 判断是否是字符串布尔值
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-28
 * @param       {any}       str   - 要检查的值
 * @returns     {boolean}         - 如果是字符串布尔值返回 true，否则返回 false
 * @example
 * ```ts
 *  isStringBoolean('true') // true
 *  isStringBoolean('false') // true
 *  isStringBoolean('abc') // false
 * ```
 */
export const isStringBoolean = (str: any): str is boolean =>
{
  if (typeof str !== 'string' || !str)
    return false
  return StringBooleanRegExp.test(str)
}