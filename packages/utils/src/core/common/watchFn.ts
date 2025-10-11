/**
 * watch 监听一个函数返回为 true 的时机，并执行回调 - 有执行间隔和次数限制
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-14
 * @param       {(() => Promise<boolean>) | (() => boolean)}    fn                  - 监听的函数
 * @param       {(result: T) => void}                           callback            - 回调函数
 * @param       {object}                                        [options]           - 配置项
 * @param       {number}                                        [options.delay=200]  - 执行间隔，单位毫秒，默认 200
 * @param       {number}                                        [options.timeout=3000]   - 超时时间，单位毫秒，默认 3000，表示不限制
 * @param       {() => void}                                    [options.timeoutFn] - 超时回调函数
 * @returns     {() => void}                                                        - 取消监听的函数
 * @example
 * ```ts
 * const cancel = watchFn(() => isReady(), () => {
 *   console.log('isReady')
 * }, { delay: 100, timeout: 5000, timeoutFn: () => {} })
 * // 取消监听
 * cancel()
 * ```
 */
export function watchFn<T = any>(
  fn: (() => T) | (() => Promise<T>),
  callback: (result: T) => void,
  options: Partial<{
    delay: number
    timeout: number
    timeoutFn: () => void
  }> = {}
): () => void
{
  const { delay = 200, timeout = 3000, timeoutFn } = options

  const startTime = Date.now()
  const interval = setInterval(async() =>
  {
    if (timeout && Date.now() - startTime > timeout)
    {
      timeoutFn && typeof timeoutFn === 'function' && timeoutFn()
      clearInterval(interval)
      return
    }
    const result = await fn()
    if (result)
      callback(result)
  }, delay) as any

  return () => clearInterval(interval)
}
