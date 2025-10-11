/**
 * 去掉字符串中的回车符
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-28
 * @param       {string}    str   字符串
 * @returns     {string}          去掉回车符后的字符串
 * @example
 * ```ts
 * const str = '123\r456\r789';
 * trimCR(str); // '123456789'
 * ```
 */
export const trimCR = (str: string): string => str.replace(TrimCRRegExp, '')

/**
 * 正则：去掉字符串中的回车符
 * @author    Yuluo
 * @link      https://github.com/YuluoY
 * @date      2024-09-28
 * @constant
 * @example
 * ```ts
 * const str = '123\r456\r789';
 * const result = str.replace(TrimCRRegExp, '');
 * console.log(result); // '123456789'
 * ```
 */
export const TrimCRRegExp = /\r+/g as Readonly<RegExp>