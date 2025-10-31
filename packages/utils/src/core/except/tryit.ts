
export type TryitResult<T, E = Error> = 
  | [error: null, data: T]
  | [error: E, data: null];

export interface TryitOptions<T, E = Error> {
  isToThrow?: boolean;
  fnArgs?: any[];
  onErrorFn?: (error: E) => void;
  errorConstructor?: new (message: string, options?: any) => E;
}

/**
 * 异常处理函数 - 错误优先
 * @author    Yuluo
 * @link      https://github.com/YuluoY
 * @date      2024-08-29
 * @template  {T}
 * @param     {Function}          fn                      函数
 * @param     {Object}            opts
 * @param     {Array}             [opts.fnArgs=[]]        函数参数，默认为[ ]
 * @param     {Boolean}           [opts.isToThrow=false]  是否抛出异常，默认为false
 * @param     {Function}          [opts.onErrorFn=null]   异常处理函数，默认为null
 * @returns   {Promise<[any, T]>}
 * @example
 * ```js
 *  const getDataBind = getData.bind(this, '123')
 *  const [err, data] = await tryit(getDataBind, { onErrorFn: console.log })
 * ```
 */
export const tryit = async <T = any, E = Error>(
  fn: (...args: any[]) => Promise<T> | T,
  opts?: TryitOptions<T, E>
): Promise<TryitResult<T, E>> => {
  const { 
    fnArgs = [], 
    isToThrow = false, 
    onErrorFn,
    errorConstructor = Error as any
  } = opts || {};

  try {
    const data = await fn(...fnArgs);
    return [null, data] as [null, T];
  } catch (err: unknown) {
    // 更好的错误规范化
    const error = err instanceof Error 
      ? err as E
      : new errorConstructor(String(err)) as E;

    // 错误回调
    if (onErrorFn) {
      onErrorFn(error);
    }

    // 重新抛出
    if (isToThrow) {
      throw error; // 保持原始错误
    }

    return [error, null] as [E, null];
  }
};