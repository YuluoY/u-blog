import type { ComputedRef, InjectionKey, Reactive } from "vue"
import type { FormContext, UFormSize } from "../types"

export const CFormLabelPosition = {
  LEFT: 'left',
  RIGHT: 'right',
  TOP: 'top',
} as const

export const CRequiredAsteriskPosition = {
  LEFT: 'left',
  RIGHT: 'right',
} as const

export const CFormSize = {
  LARGE: 'large',
  DEFAULT: 'default',
  SMALL: 'small',
} as const

export const CFormItemRuleTrigger = {
  CHANGE: 'change',
  BLUR: 'blur',
  FOCUS: 'focus',
} as const

export const CFormItemValidateStatus = {
  SUCCESS: 'success',
  ERROR: 'error',
  VALIDATING: 'validating',
} as const

// FormItem size injection key
export const FORM_ITEM_SIZE_INJECTION_KEY: InjectionKey<ComputedRef<UFormSize | undefined>> = Symbol('u-form-item-size')

export const FORM_INJECTION_KEY: InjectionKey<Reactive<FormContext>> = Symbol('u-form')