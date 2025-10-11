/**
 * 获取类型
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-08-24
 * @param       {any}           val       需要获取类型的值
 * @return      {string}
 * @example
 * ```js
 *  getType(1)    // number
 *  getType('1')  // string
 *  getType([])   // array
 *  getType({})   // object
 * ```
 */
export const getType = (val: any): string => Object.prototype.toString.call(val).slice(8, -1).toLowerCase()