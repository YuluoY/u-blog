<!--
  FormItem 表单项：标签、必填星号、校验状态与错误信息，向子组件提供 size，并注册到 Form 的 addField/removeField。
-->
<template>
  <div
    class="u-form-item"
    :class="[
      {
        'u-form-item--error': validateState === 'error',
        'u-form-item--validating': validateState === 'validating',
        'u-form-item--success': validateState === 'success',
        [`u-form-item--${form?.size}`]: form?.size
      }
    ]"
    :data-prop="typeof props.prop === 'string' ? props.prop : props.prop?.[0]"
  >
    <label
      v-if="label || $slots.label"
      class="u-form-item__label"
      :class="[form?.labelPosition ? `is-${form.labelPosition}` : '']"
      :style="labelStyle"
    >
      <span
        v-if="isRequired && !form?.hideRequiredAsterisk"
        class="u-form-item__required-star"
        :class="{ 'is-right': form?.requiredAsteriskPosition === 'right' }"
      >*</span>
      <slot name="label">{{ label }}{{ form?.labelSuffix }}</slot>
      <span
        v-if="isRequired && !form?.hideRequiredAsterisk && form?.requiredAsteriskPosition === 'right'"
        class="u-form-item__required-star"
      >*</span>
    </label>
    <div
      class="u-form-item__content"
      @blur="onFieldBlur"
      @input="onFieldInput"
    >
      <slot />
      <transition name="u-zoom-in-top">
        <div
          v-if="validateState === 'error' && showMessage && form?.showMessage"
          class="u-form-item__error"
          :class="{ 'u-form-item__error--inline': form?.inlineMessage }"
        >
          {{ validateMessage }}
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch, provide } from 'vue'
import { get } from 'lodash-es'
import type { UFormItemProps, FormContext, FormItemContext } from '../types'
import { FORM_ITEM_SIZE_INJECTION_KEY, FORM_INJECTION_KEY } from '../consts'
import { pxToRem } from '@u-blog/utils'

defineOptions({
  name: 'UFormItem',
  inheritAttrs: false
})

const props = withDefaults(defineProps<UFormItemProps>(), {
  label: '',
  prop: ''
})

const form = inject(FORM_INJECTION_KEY, null)
// 向子组件（如 Input、Button）提供表单项尺寸
const formSize = computed(() => form?.size)
provide(FORM_ITEM_SIZE_INJECTION_KEY, formSize)

const validateState = ref('')
const validateMessage = ref('')
const showMessage = computed(() => form?.showMessage ?? true)
const initialValue = ref<any>(undefined)

// 根据 form.rules 中对应 prop 的 required 判断是否必填
const isRequired = computed(() =>
{
  if (!props.prop || !form?.rules) return false
  const rules = form.rules[typeof props.prop === 'string' ? props.prop : props.prop[0]]
  if (!rules) return false
  const ruleList = Array.isArray(rules) ? rules : [rules]
  return ruleList.some(rule => rule.required)
})

// 标签宽度：数字按设计稿 px 转 rem
const labelStyle = computed(() =>
{
  if (form?.labelPosition === 'top') return {}
  const labelWidth = props.labelWidth || form?.labelWidth
  if (!labelWidth) return {}
  return {
    width: typeof labelWidth === 'number' ? pxToRem(labelWidth) : labelWidth
  }
})

/**
 * 按 trigger 执行当前表单项校验，支持 required/type/min/max/pattern/enum/validator 等规则
 */
const validate = async(trigger: string): Promise<void> =>
{
  if (!props.prop) return

  const rules = form?.rules?.[typeof props.prop === 'string' ? props.prop : props.prop[0]]
  if (!rules || !rules.length)
  {
    validateState.value = ''
    validateMessage.value = ''
    return
  }

  validateState.value = 'validating'

  try
  {
    const model = form?.model
    const value = get(model, typeof props.prop === 'string' ? props.prop : props.prop[0])
    const rulesToValidate = Array.isArray(rules) ? rules : [rules]

    const hasMatchingTrigger = rulesToValidate.some(rule =>
    {
      if (!rule.trigger) return false
      if (Array.isArray(rule.trigger)) return rule.trigger.includes(trigger)
      return rule.trigger === trigger
    })

    if (trigger && !hasMatchingTrigger)
      return

    for (const rule of rulesToValidate)
    {
      if (trigger && rule.trigger && !Array.isArray(rule.trigger) && rule.trigger !== trigger)
        continue

      if (trigger && rule.trigger && Array.isArray(rule.trigger) && !rule.trigger.includes(trigger))
        continue

      const transformedValue = rule.transform ? rule.transform(value) : value

      if (rule.validator)
      {
        await rule.validator(rule, transformedValue)
        continue
      }

      // 必填验证
      if (rule.required && (transformedValue === '' || transformedValue === null || transformedValue === undefined))
        throw new Error(rule.message || '此字段是必填的')

      if (transformedValue === null || transformedValue === undefined || transformedValue === '')
        continue

      if (rule.type)
      {
        let valid = true
        const type = rule.type

        switch (type)
        {
        case 'number':
          valid = typeof transformedValue === 'number'
          break
        case 'boolean':
          valid = typeof transformedValue === 'boolean'
          break
        case 'array':
          valid = Array.isArray(transformedValue)
          break
        case 'object':
          valid = typeof transformedValue === 'object' && !Array.isArray(transformedValue)
          break
        case 'date':
          valid = transformedValue instanceof Date
          break
        case 'url':
          try
          {
            // eslint-disable-next-line no-new
            new URL(transformedValue)
            valid = true
          }
          catch
          {
            valid = false
          }
          break
        case 'email':
          valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(transformedValue)
          break
        default:
          valid = typeof transformedValue === 'string'
        }

        if (!valid)
          throw new Error(rule.message || `类型应该是${type}`)
      }

      if (typeof transformedValue === 'string' || Array.isArray(transformedValue))
      {
        if (rule.min != null && transformedValue.length < rule.min)
        
          throw new Error(rule.message || `长度不能小于${rule.min}`)
        
        if (rule.max != null && transformedValue.length > rule.max)
        
          throw new Error(rule.message || `长度不能大于${rule.max}`)
        
        if (rule.length != null && transformedValue.length !== rule.length)
        
          throw new Error(rule.message || `长度应该是${rule.length}`)
        
      }

      if (typeof transformedValue === 'number')
      {
        if (rule.min != null && transformedValue < rule.min)
        
          throw new Error(rule.message || `不能小于${rule.min}`)
        
        if (rule.max != null && transformedValue > rule.max)
        
          throw new Error(rule.message || `不能大于${rule.max}`)
        
      }

      if (rule.enum && !rule.enum.includes(transformedValue))
        throw new Error(rule.message || `值应该在 ${rule.enum.join(', ')} 中`)

      if (rule.pattern && !rule.pattern.test(transformedValue))
      
        throw new Error(rule.message || '格式不正确')
      
    }

    validateState.value = 'success'
    validateMessage.value = ''
  }
  catch (error: any)
  {
    validateState.value = 'error'
    validateMessage.value = error.message
    throw error
  }
}

const onFieldBlur = () =>
{
  validate('blur').catch(() =>
  {})
}

const onFieldInput = (e: Event) =>
{
  const target = e.target as HTMLInputElement | HTMLTextAreaElement
  if (!props.prop || !form?.model) return

  const propPath = typeof props.prop === 'string' ? props.prop : props.prop[0]
  form.model[propPath] = target.value

  if (validateState.value === 'error')
  {
    validate('change').catch(() =>
    {})
  }
}

/** 将当前字段恢复为初始值并清空校验状态 */
const resetField = () =>
{
  if (props.prop && form?.model)
  {
    const propPath = typeof props.prop === 'string' ? props.prop : props.prop[0]
    if (initialValue.value !== undefined)
    {
      if (typeof initialValue.value === 'object')
      {
        form.model[propPath] = Array.isArray(initialValue.value)
          ? [...initialValue.value]
          : { ...initialValue.value }
      }
      else
        form.model[propPath] = initialValue.value
    }
    else
      form.model[propPath] = ''
  }
  validateState.value = ''
  validateMessage.value = ''
}

const clearValidate = () =>
{
  validateState.value = ''
  validateMessage.value = ''
}

watch(
  () => form?.model?.[typeof props.prop === 'string' ? props.prop : props.prop[0]],
  _ =>
  {
    if (validateState.value === 'error')
    {
      validate('change').catch(() =>
      {})
    }
  },
  { deep: true }
)

onMounted(() =>
{
  if (props.prop && form?.model)
  {
    const propPath = typeof props.prop === 'string' ? props.prop : props.prop[0]
    initialValue.value = form.model[propPath]
  }

  if (props.prop)
  {
    form?.addField?.({
      prop: typeof props.prop === 'string' ? props.prop : props.prop[0],
      validate,
      resetField,
      clearValidate
    })

    const input = document.querySelector(`.u-form-item[data-prop="${props.prop}"] input`)
    const textarea = document.querySelector(`.u-form-item[data-prop="${props.prop}"] textarea`)

    if (input)
    {
      input.addEventListener('blur', onFieldBlur)
      input.addEventListener('input', onFieldInput)
    }
    if (textarea)
    {
      textarea.addEventListener('blur', onFieldBlur)
      textarea.addEventListener('input', onFieldInput)
    }
  }
})

onUnmounted(() =>
{
  if (props.prop)
  {
    form?.removeField?.({
      prop: typeof props.prop === 'string' ? props.prop : props.prop[0]
    } as FormItemContext)

    const input = document.querySelector(`.u-form-item[data-prop="${props.prop}"] input`)
    const textarea = document.querySelector(`.u-form-item[data-prop="${props.prop}"] textarea`)

    if (input)
    {
      input.removeEventListener('blur', onFieldBlur)
      input.removeEventListener('input', onFieldInput)
    }
    if (textarea)
    {
      textarea.removeEventListener('blur', onFieldBlur)
      textarea.removeEventListener('input', onFieldInput)
    }
  }
})

defineExpose({
  validate,
  resetField,
  clearValidate,
  validateMessage,
  validateState
})

</script>
