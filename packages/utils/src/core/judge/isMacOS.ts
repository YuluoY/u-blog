export const MacRegExps = [/Mac(?:intosh|Intel|PPC|68K)/i, /Mac/i] as RegExp[]
/**
 * 判断当前系统是否是 macOS 系统
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-14
 * @param       {Navigator}      - 可选参数，用于指定要检查的 navigator 对象
 * @return      {boolean}
 * @example
 * ```ts
 *  isMacOS() // true or false
 * ```
 */
export const isMacOS = (navigator?: Navigator): boolean =>
{
  if (typeof navigator !== 'undefined' && navigator.userAgent)
    return MacRegExps[0].test(navigator.platform) || MacRegExps[1].test(navigator.userAgent)

  return false
}