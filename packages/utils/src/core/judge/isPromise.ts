import { isAsync } from "./isAsync"

/**
 * 是否是Promise（包括Promise实例和async函数）
 * @param       {any}         obj       - 要检查的对象或函数
 * @return      {boolean}
 * @example
 * ```ts
 * isPromise(new Promise(() => {})) // true
 * isPromise(Promise.resolve()) // true
 * isPromise(async () => {}) // true (async函数)
 * isPromise(() => {}) // false (普通函数)
 * isPromise({}) // false
 * ```
 */
export const isPromise = (obj: any): obj is Promise<any> | Function =>
{
  if (isAsync(obj))
    return true
  if (typeof obj === 'object' && obj !== null && obj.constructor.name === 'Promise')
    return true
  return false
}
  