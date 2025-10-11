/**
 * 解析 JSON 字符串
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-08-24
 * @param       {string}        str           JSON 字符串
 * @param       {T}             defVal        默认返回值
 * @returns     {T}                            解析结果或默认值
 * @example
 * ```js
 *  parseJSON('{"name": "hello world"}')  // {name: 'hello world'}
 *  parseJSON('invalid', {})              // {}
 * ```
 */
export const parseJSON = <T = any>(str: string, defVal: T): T =>
{
  if (!str || typeof str !== 'string') return defVal
  try
  {
    return JSON.parse(str) as T
  }
  catch (e)
  {
    return defVal
  }
}