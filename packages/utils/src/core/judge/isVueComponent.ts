/**
 * 是否是Vue组件
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-10-15
 * @param       {any}         obj       - 要检查的对象
 * @return      {boolean}
 * @example
 * ```ts
 * isVueComponent({ render: () => {} }) // true
 * isVueComponent({ setup: () => {} }) // true
 * isVueComponent({}) // false
 * ```
 */
export const isVueComponent = (obj: any): boolean =>
{
  return (
    typeof obj === 'object' &&
    obj !== null &&
    (typeof obj.setup === 'function' ||
      typeof obj.render === 'function' ||
      typeof obj.template === 'string' ||
      obj.functional === true) // 支持函数式组件
  )
}