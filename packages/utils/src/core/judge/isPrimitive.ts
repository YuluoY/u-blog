/**
 * 是否是基本类型
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-08-24
 * @param       {any}           val       需要判断的值
 * @return      {boolean}
 * @example
 * ```ts
 *  isPrimitive(1) // true
 *  isPrimitive('1') // true
 *  isPrimitive(true) // true
 *  isPrimitive(null) // true
 *  isPrimitive(undefined) // true
 *  isPrimitive(123n) // true
 *  isPrimitive({}) // false
 *  isPrimitive([]) // false
 *  isPrimitive(() => {}) // false
 *  ```
 */
export const isPrimitive = (val: any): val is string | number | boolean | symbol | bigint | null | undefined =>
{
  return (
    typeof val === 'number' ||
    typeof val === 'string' ||
    typeof val === 'boolean' ||
    typeof val === 'symbol' ||
    typeof val === 'bigint' ||
    val === null ||
    val === undefined
  )
}