/**
 * 是否是AsyncComponent的异步组件
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-28
 * @param       {any}         obj       - 要检查的对象
 * @return      {boolean}
 * @example
 * ```ts
 * isVueAsyncComp(defineAsyncComponent(() => import('../index')) ) // true
 * isVueAsyncComp(import('../index')) // false
 * isVueAsyncComp(() => import('../index')) // false
 * ```
 */
export const isVueAsyncComp = (obj: any): boolean =>
{
  return (
    !!obj && typeof obj === 'object' && obj.name === 'AsyncComponentWrapper' && typeof obj.__asyncLoader === 'function'
  )
}