
/**
 * 判断是否是 ECMAScript 模块环境
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-10-15
 * @return      {boolean}  如果是 ECMAScript 模块环境则返回 true，否则返回 false
 */
export const isESM = (): boolean =>
{
  // @ts-ignore
  if (typeof require === 'function' && typeof module !== 'undefined' && module.exports) return false

  if (typeof import.meta !== 'undefined') return true

  if (typeof document !== 'undefined' && document.currentScript?.type === 'module') return true

  return false
}