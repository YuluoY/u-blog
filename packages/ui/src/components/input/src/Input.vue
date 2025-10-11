<template>
  <div
    class="u-input"
    :class="{
      'u-input--suffix': $slots.suffix,
      'u-input--prefix': $slots.prefix,
      'is-disabled': disabled,
      'is-readonly': readonly,
      [`u-input--${_size}`]: _size
    }"
  >
    <div class="u-input__wapper">
      <div
        v-if="!isTextArea"
        class="u-input__prefix-wrapper"
      >
        <div
          v-if="$slots.prepend"
          class="u-input__prepend"
        >
          <slot name="prepend" />
        </div>
        <div
          v-if="$slots.prefix || prefixIcon"
          class="u-input__prefix"
        >
          <slot name="prefix">
            <u-icon :icon="prefixIcon ?? ''" />
          </slot>
        </div>
      </div>

      <input
        v-if="!isTextArea"
        :value="_value"
        class="u-input__inner"
        :type="_type"
        :placeholder="placeholder"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :readonly="readonly"
        :name="name"
        :max="max"
        :min="type === 'number' ? 0 : min"
        :autofocus="autofocus"
        :aria-label="ariaLabel"
        :tabindex="tabindex"
        :style="inputStyle"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @change="onChange"
      >

      <div
        v-if="!isTextArea"
        class="u-input__suffix-wrapper"
      >
        <div
          v-if="$slots.suffix || suffixIcon"
          class="u-input__suffix"
        >
          <slot name="suffix">
            <u-icon :icon="suffixIcon ?? ''" />
          </slot>
        </div>
        <div
          v-if="$slots.append"
          class="u-input__append"
        >
          <slot name="append" />
        </div>
        <u-icon
          v-if="isPassword && isValue"
          class="u-input__password"
          :icon="_icon"
          @click="passwordVisible = !passwordVisible"
        />
        <u-icon
          v-if="clearable && isValue"
          class="u-input__clear"
          icon="close"
          @click="onClear"
        />
      </div>
      
      <textarea
        v-if="isTextArea"
        class="u-input__inner u-textarea"
        :value="_value"
        v-bind="props"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @change="onChange"
      />
      <span
        v-if="isTextArea"
        class="u-textarea__count"
      >
        {{ (_value +'').length }} / {{ maxLength }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, inject } from 'vue'
import type { UInputEmits, UInputProps } from '../types'
import { CInputType } from '../consts'
import { FORM_ITEM_SIZE_INJECTION_KEY, UIcon } from '@/components'

defineOptions({
  name: 'UInput'
})

const props = withDefaults(defineProps<UInputProps>(), {
  type: 'text',
  size: 'default',
  showPassword: false,
  autocomplete: 'off',
  tabindex: 0
})

// 注入form-item的size
const formItemSize = inject(FORM_ITEM_SIZE_INJECTION_KEY, null)

// 计算最终的size
const _size = computed(() => formItemSize?.value || props.size)

const emits = defineEmits<UInputEmits>()

/**
 * 处理双向绑定的值
 */
const _value = computed(() => props.modelValue)
const isValue = computed(() => !!_value.value || _value.value === 0)

/**
 * 处理textarea类型
 */
const isTextArea = computed(() => props.type === CInputType.TEXTAREA)

/**
 * 处理password类型
 */
const passwordVisible = ref(isValue.value)
const isPassword = computed(() => props.type === CInputType.PASSWORD && props.showPassword)
const _icon = computed(() => passwordVisible.value ? 'eye' : 'eye-slash')
const _type = computed(() => passwordVisible.value ? CInputType.TEXT : props.type)


const onInput = (evt: Event) =>
{
  let v = (evt.target as HTMLInputElement).value as any
  v = handleBoundaryValue(v)
  emits('update:modelValue', v)
  emits('input', evt)
}
const onFocus = (evt: Event) =>
{
  emits('focus', evt)
}
const onBlur = (evt: Event) =>
{
  emits('blur', evt)
}
const onChange = (evt: Event) =>
{
  emits('change', (evt.target as HTMLInputElement).value as any)
}
const onClear = (evt: Event) =>
{
  emits('update:modelValue', '')
  emits('clear', evt)
}

/**
 * 处理边界值
 */
function handleBoundaryValue(v: string | number): string | number
{
  if (props.type === CInputType.NUMBER)
  {
    props.max && (v = Math.min(+v!, +props.max))
    props.min && (v = Math.max(+v!, +props.min))
  }
  return v
}
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>