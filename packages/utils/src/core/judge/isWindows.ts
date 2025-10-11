export const WinRegExps = [/Win/i, /Win(?:dows)?/i] as RegExp[]
/**
 * 判断当前系统是否是 Windows 系统
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-14
 * @param       {Navigator}      - 可选参数，用于指定要检查的 navigator 对象
 * @return      {boolean}
 * @example
 * ```ts
 *  isWindows() // true or false
 * ```
 */
export const isWindows = (navigator?: Navigator): boolean =>
{
  if (typeof navigator !== 'undefined' && navigator.userAgent)
    return WinRegExps[0].test(navigator.platform) || WinRegExps[1].test(navigator.userAgent)

  return false
}