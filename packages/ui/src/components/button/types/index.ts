import type { CSSProperties, Ref } from 'vue'
import { CButtonSize, CButtonType, CIconPosition } from '../consts'
import type { UIconProps } from '../../icon/types'

export type ButtonSize = typeof CButtonSize[keyof typeof CButtonSize];
export type ButtonType = typeof CButtonType[keyof typeof CButtonType];
export type ButtonIconPosition = typeof CIconPosition[keyof typeof CIconPosition];

export interface UButtonProps {
  tag?: string;      // 标签

  round?: boolean | number; // 按钮圆角
  circle?: boolean; // 按钮圆形
  plain?: boolean;  // 是否朴素按钮
  link?: boolean;  // 是否链接按钮
  bg?: boolean;   // 是否背景按钮

  type?: ButtonType;  // 按钮类型
  size?: ButtonSize;  // 按钮大小
  
  disabled?: boolean; // 按钮禁用
  loading?: boolean;  // 按钮加载
  loadingIcon?: string; // 按钮加载图标
  autofocus?: boolean; // 是否自动聚焦
  nativeType?: string; // 原生按钮类型
  autoInsertSpace?: boolean; // 是否自动插入空格
  color?: string; // 按钮颜色
  dark?: boolean; // 是否深色按钮
  icon?: UIconProps['icon'];      // 按钮图标
  iconStyle?: Partial<CSSProperties>; // 按钮图标样式
  iconProps?: UIconProps; // 按钮图标属性
  iconPosition?: ButtonIconPosition; // 按钮图标位置
  useThrottle?: boolean; // 是否使用节流
  throttleTime?: number; // 节流时间
  useDebounce?: boolean; // 是否使用防抖
  debounceTime?: number; // 防抖时间
  onClick?: (e: MouseEvent) => void; // 点击事件
}

export interface UButtonEmits {
  (e: 'click', val: MouseEvent): void
}

export interface UButtonInstance {
  ref: Ref<HTMLButtonElement | void>
}