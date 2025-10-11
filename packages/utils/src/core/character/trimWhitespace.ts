/**
 * 去掉字符串中的空格、换行符、回车符、制表符
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-28
 * @param       {string}    str   字符串
 * @returns     {string}          去掉空格、换行符、回车符、制表符后的字符串
 * @example
 * ```ts
 * const str = ' 123 \n 456 \r 789 \t ';
 * trimWhitespace(str); // '123456789'
 * ```
 */
export const trimWhitespace = (str: string): string => str.replace(TrimWhitespaceRegExp, '')

/**
 * 正则：去掉字符串中的空格、换行符、回车符、制表符
 * @author    Yuluo
 * @link      https://github.com/YuluoY
 * @date      2024-09-28
 * @constant
 * @example
 * ```ts
 * const str = ' 123 \n 456 \r 789 \t ';
 * const result = str.replace(TrimWhitespaceRegExp, '');
 * console.log(result); // '123456789'
 * ```
 */
export const TrimWhitespaceRegExp = /\s+/g as Readonly<RegExp>