/**
 * 扩展序列化对象为字符串，支持函数、Symbol 等特殊类型
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-10-15
 * @param       {T}  obj  - 包含特殊类型的对象
 * @returns     {string}  - 序列化后的字符串
 * @example
 * ```ts
 * const obj = {a: 10, b: function() {}, c: Symbol('desc'), d: undefined}
 * const str = stringifyExtended(obj);
 * console.log(str);
 * // '{"a":10,"b":"function-() {}","c":"symbol-Symbol(desc)","d":"undef-"}'
 * ```
 */
export function stringifyExtended<T = any>(obj: T): string
{
  return JSON.stringify(obj, (key, value) =>
  {
    if (typeof value === 'function') return `function-${value.toString()}`
    if (typeof value === 'symbol') return `symbol-${value.toString()}`
    if (value === undefined) return 'undef-'
    return value
  })
}