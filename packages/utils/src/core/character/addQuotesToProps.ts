/**
 * 给字符串中对象属性名加双引号
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-28
 * @param       {string}    str   字符串
 * @returns     {string}          给字符串中对象属性名加双引号后的字符串
 * @example
 * ```ts
 * const str = 'a:1,b:2,c:3';
 * const result = str.replace(addQuotesToProps, '"$1":$2');
 * console.log(result); // '"a":1,"b":2,"c":3'
 *
 * const str2 = '{a:1,b:2,c:3}';
 * const result2 = str2.replace(addQuotesToProps, '"$1":$2');
 * console.log(result2); // '{"a":1,"b":2,"c":3}'
 * ```
 */
export const addQuotesToProps = (str: string): string => str.replace(AddQuotesToPropsRegExp, '"$1":$2')

/**
 * 正则：给字符串中对象属性名加双引号
 * @author    Yuluo
 * @link      https://github.com/YuluoY
 * @date      2024-09-28
 * @constant
 * @example
 * ```ts
 * const str = 'a:1,b:2,c:3';
 * const result = str.replace(AddQuotesToPropsRegExp, '"$1":$2');
 * console.log(result); // '"a":1,"b":2,"c":3'
 *
 * const str2 = '{a:1,b:2,c:3}';
 * const result2 = str2.replace(AddQuotesToPropsRegExp, '"$1":$2');
 * console.log(result2); // '{"a":1,"b":2,"c":3}'
 * ```
 */
export const AddQuotesToPropsRegExp = /(\w+):()/g as Readonly<RegExp>