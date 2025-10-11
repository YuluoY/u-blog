export const QQRegExp = /^[1-9][0-9]{4,10}$/
/**
 * 判断是否是QQ号
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-14
 * @param       {string}      qq        - 要检查的QQ号
 * @return      {boolean}
 * @example
 * ```ts
 * isQQ('123456789') // true
 * ```
 */
export const isQQ = (qq: string): boolean => QQRegExp.test(qq)