/**
 * 正则：去掉字符串中的空格
 * @author    Yuluo
 * @link      https://github.com/YuluoY
 * @date      2024-09-28
 * @constant
 * @example
 * ```ts
 * const str = ' 123 456 789  ';
 * const result = str.replace(TrimSpaceRegExp, '');
 * console.log(result); // '123456789'
 * ```
 */
export const TrimSpaceRegExp = /\s+/g as Readonly<RegExp>

/**
 * 去掉字符串中的空格
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-28
 * @param       {string}    str   字符串
 * @returns     {string}          去掉空格后的字符串
 * @example
 * ```ts
 * const str = ' 123 456 789  ';
 * trimSpace(str); // '123456789'
 * ```
 */
export const trimSpace = (str: string): string => str.replace(TrimSpaceRegExp, '')