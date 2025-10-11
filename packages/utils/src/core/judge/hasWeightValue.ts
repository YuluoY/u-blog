import { isPlainObject, isSymbol } from "lodash-es"
import { isPrimitive } from "./isPrimitive"

/**
 * 是否有分量的值
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-14
 * @param       {any}           val       需要判断的值
 * @return      {boolean}
 * @example
 * ```ts
 * hasWeightValue(1) // true
 * hasWeightValue(0) // false
 * hasWeightValue('1') // true
 * hasWeightValue('') // false
 * hasWeightValue(true) // true
 * hasWeightValue(false) // false
 * hasWeightValue(null) // false
 * hasWeightValue(undefined) // false
 * hasWeightValue({}) // false
 * hasWeightValue([]) // false
 * ```
 */
export const hasWeightValue = (val: any): val is boolean =>
{
  if (isPrimitive(val))
  {
    if (isSymbol(val))
      return !!(val as unknown as symbol)?.description
    return !!val
  }
  if (Array.isArray(val))
    return (val as unknown as any[]).length > 0
  if (isPlainObject(val))
    return Object.keys(val).length > 0

  return false
}