import { root } from './root'

const DEFAULT_ROOT_FONT_SIZE = 10

/**
 * 获取当前文档根字号。
 * 说明：
 * - 浏览器环境优先读取 `html` 的实时计算值。
 * - 非浏览器环境（SSR/测试）统一回退到 10，保证换算可预测。
 */
function getCurrentRootFontSize(): number
{
  if (!root?.document?.documentElement)
    return DEFAULT_ROOT_FONT_SIZE

  const fontSizeText = getComputedStyle(root.document.documentElement).fontSize
  const parsedFontSize = Number.parseFloat(fontSizeText)
  return Number.isFinite(parsedFontSize) && parsedFontSize > 0
    ? parsedFontSize
    : DEFAULT_ROOT_FONT_SIZE
}

export const rootFontSize: {
  value: number
} =
{
  get value() {
    return getCurrentRootFontSize()
  },
  set value(value: number) {
    if (!root?.document?.documentElement)
      return

    root.document.documentElement.style.fontSize = `${value}px`
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
 * const px = 32
 * const rem = pxToRem(px) // '3.2rem' (根字号为 10 时)
 *
 * const rem = 2
 * const px = pxToRem(rem, { isReverse: true }) // '20px'
 *
 * const px2 = pxToRem(rem, { isReverse: true, rootFontSize: 10 }) // '20px'
 * const rem2 = pxToRem(32, { rootFontSize: 10 }) // '3.2rem'
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

  const customRootFontSize = opts.rootFontSize
  const fontSize = Number.isFinite(customRootFontSize) && (customRootFontSize as number) > 0
    ? customRootFontSize as number
    : rootFontSize.value

  if (val === undefined || Number.isNaN(val))
    return val as T
  const unit = isReverse ? 'px' : 'rem'
  const result = isReverse ? val * fontSize : val / fontSize
  return (isNumber ? result : `${result}${unit}`) as T
}
