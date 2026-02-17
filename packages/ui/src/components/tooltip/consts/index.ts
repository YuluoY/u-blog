// export const CTooltipContainerId = Symbol('u-popper-container')
export const CTooltipContainerId = 'u-popper-container'

export const CTooltipEffect = {
  /** 跟随页面主题（浅色/深色切换） */
  DEFAULT: 'default',
  DARK: 'dark',
  LIGHT: 'light'
} as const

export const CTooltipTrigger = {
  HOVER: 'hover',
  CLICK: 'click',
  FOCUS: 'focus',
  CONTEXTMENU: 'contextmenu'
} as const
