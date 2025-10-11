/**
 * 是否是浮点小数
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-08-24
 * @param       {any}           val       需要判断的值
 * @return      {boolean}
 * @example
 * ```ts
 *  isFloat(1) // false
 *  isFloat(1.1) // true
 *  isFloat('1.1') // false
 *  isFloat(NaN) // false
 *  isFloat(Infinity) // false
 * ```
 */
export const isFloat = (val: any): val is number => 
  typeof val === 'number' && !Number.isInteger(val) && !Number.isNaN(val) && isFinite(val)