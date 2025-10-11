/**
 * 将驼峰命名转换为单词分隔的字符串
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-10-15
 * @param       {string}  str         - 驼峰命名字符串
 * @param       {string}  [sep=' ']   - 分隔符
 * @returns     {string}
 * @example
 * ```ts
 * const str = 'helloWorld';
 * const result = camelToWords(str); // 'hello world'
 *
 * const str2 = 'helloWorld expandCamelCase'
 * const result2 = camelToWords(str2); // 'hello world expand camel case'
 *
 * const str3 = 'helloWorldExpandCamelCase';
 * const result3 = camelToWords(str3, '-'); // 'hello-world-expand-camel-case'
 * ```
 */
export function camelToWords(str: string, sep: string = ' '): string
{
  if (!str)
    return str
  return str
    .replace(CamelCaseRegExp, sep + '$1')
    .trim()
    .toLowerCase()
}

/**
 * 正则：展开小驼峰命名的字符串
 * @author    Yuluo
 * @link      https://github.com/YuluoY
 * @date      2024-10-15
 * @constant
 * @example
 * ```ts
 * const str = 'helloWorld';
 * const result = str.replace(CamelCaseRegExp, ' $1');
 * console.log(result); // hello world
 *
 * const str2 = 'helloWorld helloWorld';
 * const result2 = str2.replace(CamelCaseRegExp, ' $1');
 * console.log(result2); // hello world hello world
 * ```
 */
export const CamelCaseRegExp = /([A-Z])/g as Readonly<RegExp>