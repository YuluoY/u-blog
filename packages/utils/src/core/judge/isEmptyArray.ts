/**
 * 是否是空数组
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-08-24
 * @param       {any}           val       需要判断的值
 * @return      {boolean}
 * @example
 * ```ts
 *  isEmptyArray([1, 2, 3]) // false
 *  isEmptyArray([]) // true
 * ```
 */
export const isEmptyArray = (val: any): val is boolean => Array.isArray(val) && val.length === 0