<template>
  <component
    :is="tag"
    ref="_ref"
    class="u-button"
    :autofocus="autofocus"
    :type="tag === 'button' ? nativeType : void 0"
    :disabled="disabled || loading ? true : void 0"
    :class="{
      [`u-button--${type}`]: type,
      [`u-button--${_size}`]: _size,
      'is-plain': plain,
      'is-link': link,
      'is-disabled': disabled,
      'is-round': round,
      'is-loading': loading,
      'is-circle': circle
    }"
    :style="{ backgroundColor: color }"
    @click="(e: MouseEvent) => (
      useThrottle ? handleThrottleClick(e) :
      useDebounce ? handleDebounceClick(e) :
      handleClick(e)
    )"
  >
    <u-icon
      v-if="icon && iconPosition === CIconPosition.LEFT"
      :class="[
        'u-button__icon',
        'u-button__icon--left',
        { 'u-button__icon--loading': loading }
      ]"
      :style="iconStyle ?? {}"
      size="sm"
      :icon="icon"
      v-bind="_iconProps"
    />
    <span v-if="$slots.default">
      <slot />
    </span>
    <u-icon
      v-if="icon && iconPosition === CIconPosition.RIGHT"
      :class="[
        'u-button__icon',
        'u-button__icon--right',
        { 'u-button__icon--loading': loading }
      ]"
      :style="iconStyle ?? {}"
      size="sm"
      :icon="icon"
      v-bind="_iconProps"
    />
  </component>
</template>

<script setup lang="ts">
import { computed, ref, inject } from 'vue'
import type { UButtonEmits, UButtonInstance, UButtonProps } from '../types'
import { throttle, debounce } from 'lodash-es'
import { CIconPosition } from '../consts'
import { UIcon } from '@/components'
import { FORM_ITEM_SIZE_INJECTION_KEY } from '@/components/form'

defineOptions({
  name: 'UButton'
})

const emits = defineEmits<UButtonEmits>()
const props = withDefaults(defineProps<UButtonProps>(), {
  tag: 'button',
  size: 'default',
  nativeType: 'button',
  useThrottle: false,
  throttleTime: 400,
  useDebounce: false,
  debounceTime: 400,
  autofocus: false,
  loading: false,
  loadingIcon: 'spinner',
  iconPosition: 'left',
  iconProps: () => ({
    icon: ''
  })
})

// 注入form-item的size
const formItemSize = inject(FORM_ITEM_SIZE_INJECTION_KEY, null)

// 计算最终的size
const _size = computed(() => formItemSize?.value || props.size)

const slots = defineSlots()
const _ref = ref<HTMLButtonElement>()


const handleClick = (e: MouseEvent) => emits('click', e)
const handleThrottleClick = throttle(handleClick, props.throttleTime)
const handleDebounceClick = debounce(handleClick, props.debounceTime)

const _iconProps = computed<UButtonProps['iconProps']>(() => Object.assign(props.iconProps, {
  spin: props.loading || props.iconProps.spin,
  icon: (props.loading ? props.loadingIcon || props.icon || props.iconProps.icon : props.icon || props.iconProps.icon) || ''
}))

defineExpose<UButtonInstance>({
  ref: _ref
})
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>