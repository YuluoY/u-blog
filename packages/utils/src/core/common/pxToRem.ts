export const rootFontSize: {
  value: number
} =
{
  get value() {
    return parseInt(getComputedStyle(document.documentElement).fontSize, 10) || window.innerWidth / 100
  },
  set value(value: number) {
    document.documentElement.style.fontSize = `${value}px`
  }
}
/**
 * px与rem转换
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-03-03
 * @param       {number}    px  - px值
 * @param       {object}    opts  - 配置项
 * @param       {boolean}   [opts.isReverse=false]  - 是否反转
 * @param       {string}    [opts.unit]             - 单位，如果存在，则返回字符串
 * @param       {number}    [opts.rootFontSize]     - 根字体大小
 * @returns     {number | string}
 * @example
 * ```ts
 * const px = 100
 * const rem = pxToRem(px) // 100
 *
 * const rem = 10
 * const px = pxToRem(rem, { isReverse: true }) // 100
 *
 * const px2 = pxToRem(rem, { isReverse: true, rootFontSize: 16 }) // 100
 * const rem2 = pxToRem(px2) // 10
 * ```
 */
export function pxToRem<T = string | number>(
  val: number,
  opts: Partial<{
    isReverse: boolean
    isNumber: boolean
    rootFontSize: number
  }> = {}
): T
{
  const {
    isReverse = false,
    isNumber = false
  } = opts

  const fontSize = opts.rootFontSize || rootFontSize.value

  if (val === undefined || Number.isNaN(val))
    return val as T
  const unit = isReverse ? 'px' : 'rem'
  const result = isReverse ? val * fontSize : val / fontSize
  return (isNumber ? result : `${result}${unit}`) as T
}