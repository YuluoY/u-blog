import type { Component } from 'vue'
import type { CTimelinePlacement, CTimelinePosition, CTimelineSize, CTimelineType, CTimelineDirection } from '../consts'
import type { UIconProps } from '@/components/icon'

export type UTimelinePlacement = typeof CTimelinePlacement[keyof typeof CTimelinePlacement];
export type UTimelineType = typeof CTimelineType[keyof typeof CTimelineType];
export type UTimelineSize = typeof CTimelineSize[keyof typeof CTimelineSize];
export type UTimelinePosition = typeof CTimelinePosition[keyof typeof CTimelinePosition];
export type UTimelineDirection = typeof CTimelineDirection[keyof typeof CTimelineDirection];

export interface UTimelineProps {
  /**
   * @description 数据
   * @default []
   */
  data: UTimelineItemProps[];

  /**
   * @description 方向
   * @default 'vertical'
   */
  direction?: UTimelineDirection;

  /**
   * @description 间隔
   * @default 30
   */
  gutter?: number;

  /**
   * @description 边距
   * @default 20
   */
  margin?: number;

  /**
   * @description 线颜色
   * @default ''
   */
  lineColor?: string;
}

export interface UTimelineItemProps {
  /**
   * @description 内容
   * @default ''
   */
  content?: string;

  /**
   * @description 日期
   * @default ''
   */
  date?: string | Date;

  /**
   * @description 日期位置
   * @default 'top'
   */
  placement?: UTimelinePlacement;

  /**
   * @description 圆点类型
   * @default 'primary'
   */
  type?: UTimelineType;

  /**
   * @description 圆点颜色
   * @default ''
   */
  color?: string;

  /**
   * @description 圆点大小
   * @default 'default'
   */
  size?: UTimelineSize;

  /**
   * @description 圆点位置
   * @default 'default'
   */
  position?: UTimelinePosition;

  /**
   * @description 圆点自定义图标
   * @default ''
   */
  icon?: string | Component

  /**
   * @description 圆点自定义图标属性
   * @default {}
   */
  iconProps?: UIconProps

  /**
   * @description 是否是空心圆点
   * @default false
   */
  hollow?: boolean;

  /**
   * @description 圆点点击事件（点击或回车/空格键触发）
   * @default () => {}
   */
  dotClick?: (evt: MouseEvent | KeyboardEvent, item: UTimelineItemProps) => void
}

export interface UTimelineItemEmits {
  /**
   * @description 圆点点击事件（点击或回车/空格键触发）
   * @param {MouseEvent | KeyboardEvent} evt
   * @param {UTimelineItemProps} item
   */
  (e: 'dot-click', evt: MouseEvent | KeyboardEvent, item: UTimelineItemProps): void
}
export interface UTimelineContext {
  onCalcLine: () => void;
}