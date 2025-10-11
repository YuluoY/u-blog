/**
 * 去掉字符串中的换行符
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-28
 * @param       {string}    str   字符串
 * @returns     {string}          去掉换行符后的字符串
 * @example
 * ```ts
 * const str = '123\n456\n789';
 * trimNL(str); // '123456789'
 * ```
 */
export const trimNL = (str: string): string => str.replace(TrimNLRegExp, '')

/**
 * 正则：去掉字符串中的换行符
 * @author    Yuluo
 * @link      https://github.com/YuluoY
 * @date      2024-09-28
 * @constant
 * @example
 * ```ts
 * const str = '123\n456\n789';
 * const result = str.replace(TrimNLRegExp, '');
 * console.log(result); // '123456789'
 * ```
 */
export const TrimNLRegExp = /\n+/g as Readonly<RegExp>