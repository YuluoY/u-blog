export const StringFunctionRegExp = /^(function|()=>|_=>)$/
/**
 * 判断是否是字符串函数
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-28
 * @param       {any}       str   - 要检查的值
 * @returns     {boolean}         - 如果是字符串函数返回 true，否则返回 false
 * @example
 * ```ts
 *  isStringFunction('function(){}') // true
 *  isStringFunction('()=>{}') // true
 *  isStringFunction('_=>{}') // true
 * ```
 */
export const isStringFunction = (str: any): str is boolean =>
{
  if (typeof str !== 'string' || !str)
    return false
  return StringFunctionRegExp.test(str)
}
