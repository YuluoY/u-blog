import type { CFormLabelPosition, CRequiredAsteriskPosition, CFormSize, CFormItemRuleTrigger, CFormItemValidateStatus } from '../consts'
import type { ComputedRef, Ref } from 'vue'

export type UFormLabelPosition = typeof CFormLabelPosition[keyof typeof CFormLabelPosition]
export type URequiredAsteriskPosition = typeof CRequiredAsteriskPosition[keyof typeof CRequiredAsteriskPosition]
export type UFormSize = typeof CFormSize[keyof typeof CFormSize] | ''
export type UFormItemRuleTrigger = typeof CFormItemRuleTrigger[keyof typeof CFormItemRuleTrigger]
export type UFormItemValidateStatus = typeof CFormItemValidateStatus[keyof typeof CFormItemValidateStatus] | ''

export type Arrayable<T> = T | T[]
export type Value = any;
export type Values = Record<string, Value>;
export type UFormValidationResult = Promise<boolean>
export type UFormValidateCallback = (isValid: boolean, invalidFields?: ValidateFieldsError) => Promise<void> | void

export interface ValidateError {
  message?: string;
  fieldValue?: Value;
  field?: string;
}

export type ValidateFieldsError = Record<string, ValidateError[]>;

export interface FormRuleItem {
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date' | 'url' | 'email'
  required?: boolean
  message?: string
  trigger?: Arrayable<string>
  min?: number
  max?: number
  length?: number
  enum?: any[]
  pattern?: RegExp
  validator?: (rule: FormRuleItem, value: any) => Promise<void> | void
  transform?: (value: any) => any
}

export type FormRules = Partial<Record<string, Arrayable<FormRuleItem>>>

export interface FormContext {
  model?: Record<string, any>
  rules?: FormRules
  labelPosition?: UFormLabelPosition
  labelWidth?: string | number
  labelSuffix?: string
  hideRequiredAsterisk?: boolean
  requiredAsteriskPosition?: URequiredAsteriskPosition
  showMessage?: boolean
  inlineMessage?: boolean
  statusIcon?: boolean
  validateOnRuleChange?: boolean
  size?: UFormSize
  addField?: (field: FormItemContext) => void
  removeField?: (field: FormItemContext) => void
}

export interface FormItemContext {
  prop?: string
  validate: (trigger: string) => Promise<void>
  resetField: () => void
  clearValidate: () => void
}

export interface UFormProps {
  /**
   * @description 表单数据对象
   */
  model?: Record<string, any>

  /**
   * @description 表单验证规则
   */
  rules?: FormRules

  /**
   * @description 表单域标签的位置，当设置为`left`或`right`时，则也需要设置`label-width`属性
   * @default 'right'
   */
  labelPosition?: UFormLabelPosition

  /**
   * @description 表单域标签的宽度，例如`200px`。作为Form直接子元素的form-item会继承该值。也可以使用`auto`。
   * @default ''
   */
  labelWidth?: string | number

  /**
   * @description 表单域标签的后缀
   */
  labelSuffix?: string

  /**
   * @description 是否隐藏必填字段标签旁边的红色星号
   * @default false
   */
  hideRequiredAsterisk?: boolean

  /**
   * @description 星号的位置
   * @default 'left'
   */
  requiredAsteriskPosition?: URequiredAsteriskPosition

  /**
   * @description 是否显示校验信息
   * @default true
   */
  showMessage?: boolean

  /**
   * @description 是否以行内形式展示校验信息
   * @default false
   */
  inlineMessage?: boolean

  /**
   * @description 是否在输入框中显示校验结果反馈图标
   * @default false
   */
  statusIcon?: boolean

  /**
   * @description 是否在`rules`属性改变后立即触发一次验证
   * @default false
   */
  validateOnRuleChange?: boolean

  /**
   * @description 用于控制该表单内组件的尺寸
   * @default ''
   */
  size?: UFormSize

  /**
   * @description 是否为行内表单
   * @default false
   */
  inline?: boolean
}

export interface UFormEvents {
  /**
   * @description 表单验证成功时触发
   */
  validate: (prop: UFormItemProps, isValid: boolean, message: string) => void
}

export interface UFormSlots {
  /**
   * @description 自定义表单内容
   */
  default: () => InstanceType<typeof import('../src/FormItem.vue').default>
}

export interface UFormExposes {
  /**
   * @description 对整个表单的内容进行验证。接受一个回调函数，或返回`Promise`。
   */
  validate: (callback?: UFormValidateCallback) => Promise<void>

  /**
   * @description 验证具体的某个字段。
   */
  validateField: (props?: Arrayable<string | string[]> | undefined, callback?: UFormValidateCallback | undefined) => UFormValidationResult

  /**
   * @description 滚动到指定的字段
   */
  scrollToField: (prop: string | string[]) => void

  /**
   * @description 清理某个字段的表单验证信息
   */
  clearValidate: (props?: Arrayable<string | string[]> | undefined) => void

  /**
   * @description 重置表单字段的值和验证状态
   */
  resetFields: () => void
}

export interface UFormItemRule extends FormRuleItem {
  /**
   * @description 验证逻辑的触发方式
   */
  trigger: UFormItemRuleTrigger
}

export interface UFormItemProps {
  /**
   * @description `model`的属性名。它可以是一个属性的值（如: `a.b.0`或`['a', 'b', '0']`）。在使用了`validate`、`resetFields`的方法时，该属性是必填的。
   */
  prop?: string | string[]

  /**
   * @description 标签文本
   */
  label?: string

  /**
   * @description 标签宽度，例如 '50px'。支持 auto。
   */
  labelWidth?: string | number
}

export interface UFormItemExposes {
  /**
   * @description 表单项大小
   */
  size: ComputedRef<UFormSize>

  /**
   * @description 校验消息
   */
  validateMessage: Ref<string>
  
  /**
   * @description 校验状态
   */
  validateStatus: Ref<UFormItemValidateStatus>

  /**
   * @description 验证表单项
   */
  validate: (trigger: string, callback: UFormValidateCallback | undefined) => UFormValidationResult

  /**
   * @description 重置表单项
   */
  resetField: () => void

  /**
   * @description 移除该表单项的校验结果
   */
  clearValidate: () => void
}