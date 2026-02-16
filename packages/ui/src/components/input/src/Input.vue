<!--
  Input 输入框：支持前缀/后缀插槽、密码显隐、清空、字数统计，可与 FormItem 尺寸联动。
-->
<template>
  <div
    class="u-input"
    :class="{
      'u-input--suffix': $slots.suffix,
      'u-input--prefix': $slots.prefix,
      'is-disabled': disabled,
      'is-readonly': readonly,
      'u-input--textarea': isTextArea,
      [`u-input--${_size}`]: _size
    }"
  >
    <div class="u-input__wrapper">
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
        :id="inputId"
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
          :aria-label="passwordVisible ? t('input.hidePassword') : t('input.showPassword')"
          @click="passwordVisible = !passwordVisible"
        />
        <u-icon
          v-if="clearable && isValue"
          class="u-input__clear"
          icon="close"
          :aria-label="t('input.clear')"
          @click="onClear"
        />
      </div>
      
      <textarea
        v-if="isTextArea"
        class="u-input__inner u-input__textarea"
        :value="_value"
        :id="inputId"
        :name="name"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :rows="rows"
        :maxlength="maxLength"
        :aria-label="ariaLabel"
        :tabindex="tabindex"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @change="onChange"
      />
    </div>
    <span
      v-if="isTextArea && (showWordLimit || maxLength)"
      class="u-input__word-count"
    >
      {{ (_value + '').length }}{{ maxLength ? ` / ${maxLength}` : '' }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, inject, useId } from 'vue'
import type { UInputEmits, UInputProps } from '../types'
import { CInputType } from '../consts'
import { FORM_ITEM_SIZE_INJECTION_KEY } from '@/components/form'
import { UIcon } from '@/components/icon'
import { useLocale } from '@/components/config-provider'

defineOptions({
  name: 'UInput'
})

const { t } = useLocale()

const props = withDefaults(defineProps<UInputProps>(), {
  type: 'text',
  size: 'default',
  showPassword: false,
  autocomplete: 'off',
  tabindex: 0
})

/** 满足「表单字段应有 id 或 name」：未传 id 时自动生成，便于 label[for] 与无障碍 */
const fallbackId = `u-input-${useId()}`
const inputId = computed(() => props.id ?? fallbackId)

// 注入 FormItem 的 size
const formItemSize = inject(FORM_ITEM_SIZE_INJECTION_KEY, null)
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