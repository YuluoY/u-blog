<!--
  Form 表单：提供 label 布局、校验规则、尺寸等上下文，暴露 validate/validateField/resetFields/clearValidate/scrollToField。
-->
<template>
  <form
    class="u-form"
    :class="[
      labelPosition ? `u-form--label-${labelPosition}` : '',
      { 'u-form--inline': inline }
    ]"
    @submit.prevent
  >
    <slot />
  </form>
</template>

<script setup lang="ts">
import { provide, reactive } from 'vue'
import type { UFormProps, UFormExposes, FormItemContext, FormContext, UFormValidateCallback, ValidateFieldsError, Arrayable } from '../types'
import { FORM_INJECTION_KEY } from '../consts'

defineOptions({
  name: 'UForm',
  inheritAttrs: false
})

const props = withDefaults(defineProps<UFormProps & { inline?: boolean }>(), {
  labelPosition: 'right',
  labelWidth: '',
  labelSuffix: '',
  hideRequiredAsterisk: false,
  requiredAsteriskPosition: 'left',
  showMessage: true,
  inlineMessage: false,
  statusIcon: false,
  validateOnRuleChange: true,
  size: '',
  inline: false
})

const formItems: FormItemContext[] = []

/**
 * 提供给 FormItem 的上下文：model、rules、布局与校验配置，以及 addField/removeField
 */
const formContext = reactive<FormContext>({
  model: props.model,
  rules: props.rules,
  labelPosition: props.labelPosition,
  labelWidth: props.labelWidth,
  labelSuffix: props.labelSuffix,
  hideRequiredAsterisk: props.hideRequiredAsterisk,
  requiredAsteriskPosition: props.requiredAsteriskPosition,
  showMessage: props.showMessage,
  inlineMessage: props.inlineMessage,
  statusIcon: props.statusIcon,
  validateOnRuleChange: props.validateOnRuleChange,
  size: props.size,
  addField: (field: FormItemContext) =>
  {
    formItems.push(field)
  },
  removeField: (field: FormItemContext) =>
  {
    if (field.prop)
    {
      const index = formItems.indexOf(field)
      if (index !== -1)
        formItems.splice(index, 1)
    }
  }
})

provide(FORM_INJECTION_KEY, formContext)

/**
 * 校验全部表单项，成功调用 callback(true)，失败 callback(false, invalidFields)
 */
const validate = async(callback?: UFormValidateCallback): Promise<void> =>
{
  const invalidFields: ValidateFieldsError = {}

  const validateFields = formItems.map(item => item.validate(''))

  try
  {
    await Promise.all(validateFields)
    callback?.(true)
  }
  catch (fields)
  {
    callback?.(false, invalidFields)
  }
}

/**
 * 仅校验指定 prop 的字段
 */
const validateField = async(props?: Arrayable<string | string[]>, callback?: UFormValidateCallback): Promise<boolean> =>
{
  if (!props) return true

  const propsArray = Array.isArray(props) ? props : [props]
  const fields = propsArray.flat()
  
  const validateFields = formItems
    .filter(item => item.prop && fields.includes(item.prop))
    .map(item => item.validate(''))

  try
  {
    await Promise.all(validateFields)
    callback?.(true)
    return true
  }
  catch (error)
  {
    callback?.(false)
    return false
  }
}

/** 将所有表单项重置为初始值并清空校验状态 */
const resetFields = () =>
{
  formItems.forEach(item =>
  {
    item.resetField()
  })
}

/** 清除校验状态，不传 prop 时清除全部 */
const clearValidate = (props?: Arrayable<string | string[]>) =>
{
  if (!props)
  {
    formItems.forEach(item => item.clearValidate())
    return
  }

  const propsArray = Array.isArray(props) ? props : [props]
  const fields = propsArray.flat()

  formItems.forEach(item =>
  {
    if (item.prop && fields.includes(item.prop))
    
      item.clearValidate()
    
  })
}

/** 滚动到指定 prop 对应的表单项（smooth） */
const scrollToField = (prop: string | string[]) =>
{
  const field = formItems.find(item =>
    item.prop === (Array.isArray(prop) ? prop[0] : prop)
  )
  if (field)
  {
    const el = document.querySelector(`.u-form-item[data-prop="${field.prop}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}

defineExpose<UFormExposes>({
  validate,
  validateField,
  clearValidate,
  scrollToField,
  resetFields
})
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>

