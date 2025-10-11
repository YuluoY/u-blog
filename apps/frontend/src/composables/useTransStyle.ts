import { pxToRem } from '@u-blog/utils'
import { isNumber } from 'lodash-es'
import type { CSSProperties } from 'vue'

export const useTransStyle = (style: CSSProperties): CSSProperties =>
{
  // 处理px => rem
  for (const [key, value] of Object.entries(style))
  {
    if (isNumber(value))
      style[key as keyof CSSProperties] = pxToRem(value)
  }

  return style
}