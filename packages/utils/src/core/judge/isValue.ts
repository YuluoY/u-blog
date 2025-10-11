/**
 * 判断是否是值
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-10-15
 * @param       {any}         val       - 要检查的对象
 * @return      {boolean}
 * @example
 * ```ts
 * isValue(123) // true
 * isValue('123') // true
 * isValue(true) // true
 * isValue(null) // false
 * isValue(undefined) // false
 * isValue(NaN) // false
 * ```
 */
export const isValue = (val: any): boolean =>
  val !== null && val !== undefined && !Number.isNaN(val)