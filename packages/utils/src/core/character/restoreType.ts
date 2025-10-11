import { isStringArray, isStringFunction, isStringNumber, isStringObject } from "../judge"
import { safeEval } from "./safeEval"

/**
 * 字符串值还原类型值
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-24
 * @param       {string}  str - 字符串
 * @returns     {any}         - 还原后的值
 * @example
 * ```ts
 * restoreType('undefined') // undefined
 * restoreType('null') // null
 * restoreType('true') // true
 * restoreType('false') // false
 * restoreType('NaN') // NaN
 * restoreType('Infinity') // Infinity
 * restoreType('-Infinity') // -Infinity
 * restoreType<string>('123') // 123
 * restoreType<{a: number}>('{"a":1}') // {a: 1}
 * restoreType<{a: number[]}>('{a:[1,2,3]}') // {a: [1,2,3]}
 * restoreType<number[]>('[1,2,3]') // [1,2,3]
 * ```
 */
export function restoreType<T = any>(str: string): T
{
  if (typeof str !== 'string') return str
  str = str.trim()

  if (str === 'undefined') return undefined as T
  if (str === 'null') return null as T
  if (str === 'true') return true as T
  if (str === 'false') return false as T
  if (str === 'NaN') return NaN as T
  if (str === 'Infinity') return Infinity as T
  if (str === '-Infinity') return -Infinity as T
  if (isStringNumber(str)) return Number(str) as T
  if (isStringArray(str) || isStringObject(str) || isStringFunction(str)) return safeEval<T>(str) as T
  return str as T
}
