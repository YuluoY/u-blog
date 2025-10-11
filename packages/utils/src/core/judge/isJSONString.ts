/**
 * 判断是否是JSON string
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-14
 * @param       {any}       str   - 要检查的值
 * @returns     {boolean}         - 如果是JSON string返回 true，否则返回 false
 * @example
 * ```ts
 *  isJSONString('{"name": "John", "age": 30}') // true
 *  isJSONString('{"name": "John", "age": 30,}') // false
 *  isJSONString('hello') // false
 *  isJSONString('[1,2,3]') // true
 *  isJSONString('"string"') // true
 * ```
 */
export const isJSONString = (str: any): str is string =>
{
  if (typeof str !== 'string') return false
  str = str.trim()
  // 判断两边是否有括号或引号
  if (!str.startsWith('{') && !str.startsWith('[') && !str.startsWith('"')) return false
  try
  {
    JSON.parse(str)
    return true
  }
  catch (e)
  {
    return false
  }
}