import { startsWith } from 'lodash-es';
import { restoreType } from './restoreType';
/**
 * 正则：提取Symbol中的字符串
 * @author    Yuluo
 * @link      https://github.com/YuluoY
 * @date      2024-10-15
 * @constant
 * @example
 * ```ts
 * const str = 'Symbol("hello world")';
 * const result = str.replace(SymbolRegExp, '$1');
 * console.log(result); // hello world
 *
 * const str2 = 'Symbol("hello world") Symbol("hello world")';
 * const result2 = str2.replace(SymbolRegExp, '$1');
 * console.log(result2); // hello world hello world
 * ```
 */
export const SymbolRegExp = /Symbol\("([^"]*)"\)/g as Readonly<RegExp>
/**
 * 扩展解析 JSON 字符串，支持函数、Symbol 等特殊类型
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-10-15
 * @param       {string}  str  - 包含特殊类型的 JSON 字符串
 * @returns     {T}            - 解析后的对象
 * @example
 * ```ts
 * const str = '{"a":10,"b":"function-() {}","c":"symbol-description","d":"undef-"}'
 * const obj = parseExtended(str);
 * console.log(obj);
 * // {a: 10, b: function() {}, c: Symbol(description), d: undefined}
 * ```
 */
export function parseExtended<T = any>(str: string): T
{
  try
  {
    return JSON.parse(str, (key, value) =>
    {
      if (startsWith(value, 'function-')) return new Function(`return ${value.slice(9)}`)()
      if (startsWith(value, 'symbol-'))
      {
        const match = value.slice(7).match(SymbolRegExp)
        return match ? Symbol(match[1]) : value
      }
      if (startsWith(value, 'undef-'))
        return undefined
      return restoreType(value)
    })
  }
  catch (error)
  {
    return str as T
  }
}