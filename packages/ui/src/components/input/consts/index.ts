export const CInputType = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  PASSWORD: 'password',
  CHECKBOX: 'checkbox',
  FILE: 'file',
  NUMBER: 'number',
  RADIO: 'radio',
  DATETIME_LOCAL: 'datetime-local'
} as const

export const CInputSize = {
  SMALL: 'small',
  DEFAULT: 'default',
  LARGE: 'large'
} as const

export const CInputResize = {
  NONE: 'none',
  BOTH: 'both',
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical'
} as const