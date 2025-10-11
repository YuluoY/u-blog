/**
 * 保留指定小数位数
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-10-17
 * @param       {number}  num  - 数字
 * @param       {number}  [digits=2]  - 保留的小数位数
 * @returns     {number}
 * @example
 * ```ts
 * const num = 10.123456;
 * const result = toFixed(num); // 10.12
 *
 * const num2 = 10.123456;
 * const result2 = toFixed(num2, 4); // 10.1234
 * ```
 */
export const toFixed = (num: number, digits: number = 2): number =>
{
  try {
    const strNum = num + ''
    const index = strNum.indexOf('.')
    if (index === -1)
      return num
    return Number(strNum.slice(0, index + digits + 1))
  } catch (error) {
    return num
  }
}