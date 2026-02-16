<!--
  UPopconfirm 气泡确认框
  点击触发元素后以 Tooltip 形式展示确认文案与确定/取消按钮，支持自定义插槽与国际化。
-->
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
        role="alertdialog"
        :aria-describedby="popconfirmTitleId"
        aria-modal="true"
      >
        <div class="u-popconfirm__content" :id="popconfirmTitleId">
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
    <div class="u-popconfirm__reference">
      <slot name="reference" />
    </div>
  </u-tooltip>
</template>

<script setup lang="ts">
/**
 * UPopconfirm 气泡确认框
 * 基于 Tooltip + 确定/取消按钮，支持国际化（useLocale）与无障碍（role="alertdialog"）。
 */
import { computed, ref } from 'vue'
import { UTooltip } from '@/components/tooltip'
import { UButton } from '@/components/button'
import { UIcon } from '@/components/icon'
import { useLocale } from '@/components/config-provider'
import type { UPopconfirmEmits, UPopconfirmProps } from '../types'
import { pxToRem } from '@u-blog/utils'
import type { UTooltipExposes } from '@/components/tooltip'

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
/** 用于 aria-describedby，保证无障碍关联 */
const popconfirmTitleId = `u-popconfirm-title-${Math.random().toString(36).slice(2, 9)}`
const emits = defineEmits<UPopconfirmEmits>()
const tooltipRef = ref<UTooltipExposes | null>(null)
const minWidth = computed(() => pxToRem<string>(props.width))

/** 国际化：未传 cancelButtonText/confirmButtonText 时使用 locale 文案 */
const { t } = useLocale()
const cancelText = computed(() => props.cancelButtonText ?? t('popconfirm.cancelButtonText'))
const confirmText = computed(() => props.confirmButtonText ?? t('popconfirm.confirmButtonText'))
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