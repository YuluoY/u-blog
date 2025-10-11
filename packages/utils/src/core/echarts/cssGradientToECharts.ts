/**
 * 验证 CSS 渐变格式的正则表达式
 * 匹配 linear-gradient( 或 radial-gradient( 开头的字符串
 */
export const GradientFormatRegex = /^(linear-gradient|radial-gradient)\(/

/**
 * 提取 CSS 渐变中颜色和位置信息的正则表达式
 * 匹配 rgba(r,g,b,a) percentage% 格式的颜色定义
 * 捕获组：1-r, 2-g, 3-b, 4-a(可选), 5-position
 */
export const ColorRegex = /rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),?\s*([\d.]+)?\)\s+(\d{1,3})%/g

/**
 * 提取线性渐变角度的正则表达式
 * 匹配 linear-gradient(angle deg 格式中的角度值
 * 捕获组：1-angle
 */
export const AngleRegex = /linear-gradient\(([\d.-]+)deg/

/**
 * 将 CSS 渐变（线性或径向）转换为 ECharts 的渐变配置
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-14
 * @param       {string} cssGradient  - CSS 渐变字符串 (linear-gradient 或 radial-gradient)
 * @returns     {Object}              - ECharts 兼容的渐变配置 (linearGradient 或 radialGradient)
 * @example
 * ```js
 *  cssGradientToECharts('linear-gradient(45deg, rgba(255, 0, 0, 1) 0%, rgba(0, 255, 0, 1) 100%)');
 *
 *  // 输出:
 *  {
 *    type: 'linear',
 *    x: 0.7071067811865476,
 *    y: 0.7071067811865475,
 *    x2: 1,
 *    y2: 0,
 *    colorStops:
 *      [
 *        { offset: 0, color: 'rgba(255, 0, 0, 1)' },
 *        { offset: 1, color: 'rgba(0, 255, 0, 1)' }
 *      ],
 *    global: false,
 *    value: 'linear-gradient(45deg, rgba(255, 0, 0, 1) 0%, rgba(0, 255, 0, 1) 100%)'
 *  }
 *  ```
 */
export function cssGradientToECharts(cssGradient: string):
  | {
      type: 'linear' | 'radial'
      x: number
      y: number
      x2?: number
      y2?: number
      r?: number
      colorStops: { offset: number; color: string }[]
      global: boolean
      value: string
    }
  | string
{
  // 输入验证
  if (!cssGradient || typeof cssGradient !== 'string') {
    return cssGradient || ''
  }
  
  // 长度限制，防止 ReDoS 攻击
  if (cssGradient.length > 10000) {
    console.warn('cssGradientToECharts: 输入字符串过长，可能存在安全风险')
    return cssGradient
  }
  
  // 基本格式验证
  if (!GradientFormatRegex.test(cssGradient)) {
    return cssGradient
  }

  // 判断是线性渐变还是径向渐变
  const isLinear = cssGradient.startsWith('linear-gradient')
  const isRadial = cssGradient.startsWith('radial-gradient')
  const colorStops: { offset: number; color: string }[] = []
  let match: RegExpExecArray | null
  let matchCount = 0
  const maxMatches = 20 // 限制匹配次数，防止无限循环

  // 提取所有颜色和它们的百分比位置
  while ((match = ColorRegex.exec(cssGradient)) !== null && matchCount < maxMatches)
  {
    matchCount++
    const [, r, g, b, a = '1', position] = match
    
    // 验证颜色值范围
    const red = Math.max(0, Math.min(255, parseInt(r)))
    const green = Math.max(0, Math.min(255, parseInt(g)))
    const blue = Math.max(0, Math.min(255, parseInt(b)))
    const alpha = Math.max(0, Math.min(1, parseFloat(a)))
    const pos = Math.max(0, Math.min(100, parseInt(position)))
    
    colorStops.push({
      offset: pos / 100, // 将百分比转换为 0-1 范围
      color: `rgba(${red}, ${green}, ${blue}, ${alpha})`
    })
  }

  if (isLinear)
  {
    // 解析线性渐变的方向
    const angleMatch = AngleRegex.exec(cssGradient)
    let angle = 0
    
    if (angleMatch) {
      const rawAngle = parseFloat(angleMatch[1])
      // 限制角度范围，防止溢出
      angle = Math.max(-360, Math.min(360, rawAngle))
    }

    // 安全的三角函数计算
    const radians = (angle * Math.PI) / 180
    const x = Math.cos(radians)
    const y = Math.sin(radians)

    // 返回 ECharts 的 linearGradient 配置
    return {
      type: 'linear',
      x: isFinite(x) ? x : 0, // 防止 NaN
      y: isFinite(y) ? y : 0, // 防止 NaN
      x2: 1,
      y2: 0,
      colorStops: colorStops,
      global: false,
      value: cssGradient
    }
  }
  else if (isRadial)
  {
    // 返回 ECharts 的 radialGradient 配置
    return {
      type: 'radial',
      x: 0.5, // 渐变中心 x 坐标
      y: 0.5, // 渐变中心 y 坐标
      r: 0.5, // 渐变半径
      colorStops: colorStops,
      global: false,
      value: cssGradient
    }
  }
  else
  {
    // 如果不支持，返回原始字符串
    return cssGradient
    // throw new Error('不支持的渐变类型，仅支持 linear-gradient 和 radial-gradient。');
  }
}