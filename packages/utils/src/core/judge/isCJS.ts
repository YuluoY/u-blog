/**
 * 判断是否是 CommonJS 模块环境
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-10-15
 * @return      {boolean}  如果是 CommonJS 模块环境则返回 true，否则返回 false
 */
export const isCJS = (): boolean =>
{
  if (
    // @ts-ignore
    typeof require === 'function' &&
    // @ts-ignore
    typeof module === 'object' &&
    // @ts-ignore
    module !== null &&
    // @ts-ignore
    typeof module.exports === 'object'
  )
    return true

  // @ts-ignore
  if (typeof global === 'object' && typeof process === 'object' && typeof __dirname === 'string') return true

  return false
}