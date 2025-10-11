export const UrlRegExp = /^(((ht|f)tps?):\/\/)?([^!@#$%^&*?.\s-]([^!@#$%^&*?.\s]{0,63}[^!@#$%^&*?.\s])?\.)+[a-z]{2,6}\/?/
/**
 * 判断是否是URL
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-14
 * @param       {string}      url       - 要检查的URL
 * @return      {boolean}
 * @example
 * ```ts
 *  isURL('https://www.baidu.com') // true
 *  isURL('www.baidu.com') // true
 *  isURL('baidu.com') // true
 * ```
 */
export const isURL = (url: string): boolean => UrlRegExp.test(url)