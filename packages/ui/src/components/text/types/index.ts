import type { CTextSize, CTextType } from '../consts'

export type UTextType = typeof CTextType[keyof typeof CTextType];
export type UTextSize = typeof CTextSize[keyof typeof CTextSize];

export interface UTextProps {
  type?: UTextType
  size?: UTextSize
  ellipsis?: boolean
  maxLine?: number
  tag?: string
}