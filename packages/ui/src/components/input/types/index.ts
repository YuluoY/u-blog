import type { CSSProperties, InputHTMLAttributes, ReservedProps } from 'vue'
import type { CInputSize, CInputType, CInputResize } from '../consts'
import type { UIconProps } from '@/components'

type Input = InputHTMLAttributes & ReservedProps
export type UInputType = typeof CInputType[keyof typeof CInputType];
export type UInputSize = typeof CInputSize[keyof typeof CInputSize];
export type UInputResize = typeof CInputResize[keyof typeof CInputResize];

export interface UInputProps {
  modelValue?: string | number
  type?: UInputType
  size?: UInputSize
  maxLength?: number | string
  minLength?: number | string
  autocomplete?: Input['autocomplete']
  name?: Input['name']
  readonly?: Input['readonly']
  max?: Input['max']
  min?: Input['min']
  step?: Input['step']
  autofocus?: Input['autofocus']
  form?: Input['form']
  ariaLabel?: Input['aria-label']
  tabindex?: Input['tabindex']
  placeholder?: string
  clearable?: boolean // 是否可清空
  disabled?: boolean
  showPassword?: boolean // 是否显示密码图标
  prefixIcon?: UIconProps['icon']
  suffixIcon?: UIconProps['icon']
  validating?: boolean // 是否处于校验中
  inputStyle?: CSSProperties | CSSProperties[] | string[]
  
  showWordLimit?: boolean // 是否显示字数统计 text / textarea
  rows?: number // textarea
}

export interface UInputEmits {
  (e: 'update:modelValue', value: string | number): void
  (e: 'change', value: string | number): void
  (e: 'focus', evt: FocusEvent | Event): void
  (e: 'blur', evt: FocusEvent | Event): void
  (e: 'clear', evt: MouseEvent | Event): void
  (e: 'input', evt: InputEvent | Event): void
}