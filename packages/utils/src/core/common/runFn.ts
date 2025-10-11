
/**
 * 立即执行函数
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-24
 * @param       {() => void}  fn  - 需要执行的函数
 * @returns     {any}             - 返回值
 * @example
 * ```ts
 * const result = runFn(() => 'hello', null) // hello
 * ```
 */
export const runFn = <T = any>(fn: () => T, ctx: any): T =>
{
  if (ctx)
    return fn.call(ctx)
  return fn()
}