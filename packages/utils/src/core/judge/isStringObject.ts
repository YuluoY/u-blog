export const StringObjectRegExp = /^{.*}$/
/**
 * 判断是否是字符串对象
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-28
 * @param       {any}         str   - 要检查的值
 * @returns     {boolean}           - 如果是字符串对象返回 true，否则返回 false
 * @example
 * ```ts
 *  isStringObject('{"name": "John", "age": 30}') // true
 *  isStringObject('{"name": "John", "age": 30,}') // true
 *  isStringObject('{name: "John", age: 30}') // true
 * ```
 */
export const isStringObject = (str: any): str is boolean =>
{
  if (typeof str !== 'string' || !str)
    return false
  return StringObjectRegExp.test(str)
}