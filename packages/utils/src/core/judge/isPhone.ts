export const PhoneRegExps: RegExp[] = [
  /^(?:(?:\+|00)86)?1[3-9]\d{9}$/, // 宽松模式
  /^(?:(?:\+|00)86)?1(?:(?:3[\d])|(?:4[5-79])|(?:5[0-35-9])|(?:6[5-7])|(?:7[0-8])|(?:8[\d])|(?:9[1589]))\d{8}$/ // 严格模式
]
/**
 * 判断是否是移动手机号 - 有严格与宽松两种模式
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-14
 * @param       {string}      phone     - 要检查的手机号
 * @param       {boolean}     strict    - 是否严格模式，默认为 false
 * @return      {boolean}
 * @example
 * ```ts
 * isPhone('12345678901') // true
 * isPhone('12345678901', true) // false
 * ```
 */
export const isPhone = (phone: string, strict: boolean = false): boolean =>
  strict ? PhoneRegExps[1].test(phone) : PhoneRegExps[0].test(phone)