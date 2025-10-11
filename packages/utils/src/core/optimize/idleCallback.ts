
/**
 * 浏览器空闲时间执行
 * @author    Yuluo
 * @link      https://github.com/YuluoY
 * @date      2024-08-24
 * @param     {Function}    fn     回调函数
 * @returns   {number}
 * @example
 * ```js
 *  idleCallback(() => console.log('hello world'))
 * ```
 */
export const idleCallback = (fn: Function): number =>
{
  return window.requestIdleCallback(async(idle: IdleDeadline) =>
  {
    while (idle.timeRemaining() > 0)
      fn && typeof fn === 'function' && (await fn())
  })
}