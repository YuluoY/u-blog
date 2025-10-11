/**
 * 是否是async函数
 * @param       {any}         obj       - 要检查的对象或函数
 * @return      {boolean}
 * @example
 * ```ts
 * isAsync(async () => {}) // true
 * isAsync(() => {}) // false
 * ```
 */
export const isAsync = (obj: any): obj is Function => typeof obj === 'function' && obj.constructor.name === 'AsyncFunction'