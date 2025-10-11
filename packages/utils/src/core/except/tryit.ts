/**
 * 异常处理函数
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
export const tryit = async <T = any>(
  fn: Function,
  opts: {
    isToThrow?: boolean
    fnArgs?: any[]
    onErrorFn?: (e: any) => void | null
  }
): Promise<[any, T]> =>
{
  const { fnArgs = [], isToThrow = false, onErrorFn = null } = opts

  const o = [] as unknown as [any, T]
  try
  {
    o[1] = await fn(...fnArgs)
  }
  catch (err: any)
  {
    if (isToThrow) throw new Error(err)
    if (onErrorFn && typeof onErrorFn === 'function')
      onErrorFn(err.message || err)
    o[0] = err
  }
  return o
}
