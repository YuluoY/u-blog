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

// 提供给FormItem的上下文
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

// 暴露方法
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

const resetFields = () =>
{
  formItems.forEach(item =>
  {
    item.resetField()
  })
}

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

const scrollToField = (prop: string | string[]) =>
{
  const field = formItems.find(item =>
    item.prop === (Array.isArray(prop) ? prop[0] : prop)
  )
  if (field)
  {
    // 这里可以添加滚动到字段的逻辑
    // 例如使用 scrollIntoView
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

