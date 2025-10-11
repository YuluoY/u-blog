export const MobileRegExp =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Windows Phone|Windows Mobile|MeeGo|Tizen|Bada|Kindle|Silk|MiuiBrowser|SamsungBrowser|OPR\/|Fennec/i
/**
 * 判断是否是移动端
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-14
 * @param       {Navigator}      - 可选参数，用于指定要检查的 navigator 对象
 * @return      {boolean}
 * @example
 * ```ts
 *  isMobile() // true or false
 * ```
 */
export const isMobile = (navigator?: Navigator): boolean =>
{
  if (typeof navigator !== 'undefined' && navigator.userAgent)
    return MobileRegExp.test(navigator.userAgent.toLocaleLowerCase())

  return false
}