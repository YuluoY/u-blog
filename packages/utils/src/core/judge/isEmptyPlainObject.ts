import { isPlainObject } from "lodash-es";

/**
 * 是否是普通空对象
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-14
 * @param       {any}           val       需要判断的值
 * @return      {boolean}
 * @example
 * ```ts
 *  isEmptyPlainObject({}) // true
 *  isEmptyPlainObject({a: 1}) // false
 *  isEmptyPlainObject([]) // false
 * ```
 */
export const isEmptyPlainObject = (val: any): val is boolean => isPlainObject(val) && Object.keys(val).length === 0