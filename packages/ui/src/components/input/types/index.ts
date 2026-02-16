import type { CSSProperties, InputHTMLAttributes, ReservedProps } from 'vue'
import type { CInputSize, CInputType, CInputResize } from '../consts'
import type { UIconProps } from '@/components/icon'

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
  /** 原生 id，用于 label[for] 关联与无障碍；未传时内部自动生成 */
  id?: Input['id']
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

export interface UInputNumberProps {
  modelValue?: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  controls?: boolean
  placeholder?: string
  ariaLabel?: string
}

export interface UInputNumberEmits {
  (e: 'update:modelValue', value: number | undefined): void
  (e: 'change', value: number | undefined): void
  (e: 'focus', evt: FocusEvent): void
  (e: 'blur', evt: FocusEvent): void
}