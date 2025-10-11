import { isFunction, isPlainObject } from "lodash-es"
export type ToValue<T = any> = T | (() => T) | { value: T }
/**
 * 转换为值
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-24
 * @param       {any}  val  - 需要转换的值
 * @returns     {any}             - 返回值
 * @example
 * ```ts
 * const result = toValue(() => 'hello', null) // hello
 * ```
 */
export const toValue = <T = any>(val: ToValue<T>): T =>
{
  if (isFunction(val))
    return val()
  if (isPlainObject(val) && 'value' in (val as { value: T }))
    return (val as { value: T }).value
  return val as T
}