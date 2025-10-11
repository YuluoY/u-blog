import { isPlainObject } from "lodash-es";

/**
 * 是否是空对象
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-08-24
 * @param       {any}           val       需要判断的值
 * @return      {boolean}
 * @example
 * ```ts
 *  isEmptyObject({}) // true
 *  isEmptyObject({a: 1}) // false
 *  isEmptyObject([]) // true
 * ```
 */
export const isEmptyObject = (val: any): val is boolean =>
  (isPlainObject(val) && Object.keys(val).length === 0) || (Array.isArray(val) && (val as unknown as any[]).length === 0)
