/**
 * 去掉字符串中的制表符
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-28
 * @param       {string}    str   字符串
 * @returns     {string}          去掉制表符后的字符串
 * @example
 * ```ts
 * const str = '123\t456\t789';
 * trimTabForString(str); // '123456789'
 * ```
 */
export const trimTab = (str: string): string => str.replace(TrimTabRegExp, '')

/**
 * 正则：去掉字符串中的制表符
 * @author    Yuluo
 * @link      https://github.com/YuluoY
 * @date      2024-09-28
 * @constant
 * @example
 * ```ts
 * const str = '123\t456\t789';
 * const result = str.replace(TrimTabRegExp, '');
 * console.log(result); // '123456789'
 * ```
 */
export const TrimTabRegExp = /\t+/g as Readonly<RegExp>