<template>
  <u-tooltip
    ref="tooltipRef"
    v-model:visible="visible"
    class="u-popconfirm"
    effect="light"
    trigger="click"
    v-bind="tooltipProps"
  >
    <template #content>
      <main
        :style="{ minWidth }"
        class="u-popconfirm__main"
      >
        <div class="u-popconfirm__content">
          <u-icon
            class="u-popconfirm__icon"
            :icon="icon"
          />
          <slot>
            <span class="u-popconfirm__title">{{ title }}</span>
          </slot>
        </div>
        <div class="u-popconfirm__actions">
          <slot
            name="actions"
            :confirm="onConfirm"
            :cancel="onCancel"
          >
            <u-button
              class="u-popconfirm__cancel"
              size="small"
              :type="cancelType"
              v-bind="cancelButtonProps"
              @click="onCancel"
            >
              {{ cancelText }}
            </u-button>
            <u-button
              class="u-popconfirm__confirm"
              size="small"
              :type="confirmType"
              v-bind="confirmButtonProps"
              @click="onConfirm"
            >
              {{ confirmText }}
            </u-button>
          </slot>
        </div>
      </main>
    </template>
    <div class="u-popconfirm__refrence">
      <slot name="reference" />
    </div>
  </u-tooltip>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { UTooltip, UButton, UIcon } from '@/components'
import type { UPopconfirmEmits, UPopconfirmProps } from '../types'
import { pxToRem } from '@u-blog/utils'
import type { UTooltipExposes } from '@/components'

defineOptions({
  name: 'UPopconfirm'
})
const props = withDefaults(defineProps<UPopconfirmProps>(), {
  title: '',
  width: 150,
  icon: 'question-circle',
  tooltipProps: void 0,
})
const visible = ref(false)
const emits = defineEmits<UPopconfirmEmits>()
const tooltipRef = ref<UTooltipExposes | null>(null)
const minWidth = computed(() => pxToRem<string>(props.width))

const cancelText = computed(() => props.cancelButtonText ?? '取消')
const confirmText = computed(() => props.confirmButtonText ?? '确定')
const cancelType = computed(() => props.cancelButtonType ?? void 0)
const confirmType = computed(() => props.confirmButtonType ?? 'primary')

const onConfirm = (evt: MouseEvent) =>
{
  tooltipRef.value?.onClose()
  emits('confirm', evt)
}

const onCancel = (evt: MouseEvent) =>
{
  tooltipRef.value?.onClose()
  emits('cancel', evt)
}

</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>