<!--
  Dialog 弹窗：可拖拽、可缩放、可折叠，支持 Teleport、zIndex 堆叠、ESC 关闭与国际化。
-->
<template>
  <Teleport :to="appendTo">
    <div
      v-if="visible"
      class="u-dialog-overlay"
      :class="{ [modalClass || 'is-overlay']: modal }"
      :style="{zIndex: _zIndex}"
      @click.self.prevent="onOverlayClick"
    >
      <div
        ref="dialogRef"
        class="u-dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="uid"
      >
        <div
          ref="dialogHeaderRef"
          class="u-dialog__header"
          @click="onActive"
        >
          <div class="u-dialog__title" :id="titleId">
            <span :title="title">{{ title }}</span>
          </div>
          <div class="u-dialog__header-actions">
            <u-icon
              v-if="showCollapseIcon"
              class="u-dialog__minimize"
              :icon="_collapseIcon"
              :rotation="isCollapsed ? 180 : 'default'"
              @click="onCollapse"
            />
            <u-icon
              v-if="showCloseIcon"
              class="u-dialog__close"
              :icon="_closeIcon"
              @click="close"
            />
          </div>
        </div>
        <div
          :id="uid"
          class="u-dialog__body"
        >
          <slot>
            <span
              v-if="isString(component)"
              v-html="component"
            />
            <component
              :is="component"
              v-else
            />
          </slot>
        </div>
        <div
          v-if="showFooter"
          class="u-dialog__footer custom-scrollbar"
        >
          <slot name="footer">
            <u-button type="primary" @click="onConfirm">{{ t('dialog.confirm') }}</u-button>
            <u-button plain @click="close">{{ t('dialog.cancel') }}</u-button>
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useAttrs, watch, useId } from 'vue'
import type { UDialogEmits, UDialogExposes, UDialogProps } from '../types'
import { useEventListener, useResize, useDraggle } from '@u-blog/composables'
import { UIcon } from '@/components/icon'
import { UButton } from '@/components/button'
import { useLocale } from '@/components/config-provider'
import { isFunction, isString } from 'lodash-es'
import { cacheZIndex, getNextZIndex, getZIndexs, isExistBiggerZIndex } from '../cache'

defineOptions({
  name: 'UDialog',
  inheritAttrs: false
})

const { t } = useLocale()
const props = withDefaults(defineProps<UDialogProps>(), {
  component: '弹窗内容',
  openDelay: 0,
  closeDelay: 0,
  appendTo: 'body',
  modal: false,
  width: 0.4,
  height: 0.4,
  title: '标题',
  zIndex: 2000,
  showCloseIcon: true,
  showFooter: true,
  isLimitBounds: false
})
const uid = `u-dialog-${useId()}`
const titleId = `${uid}-title`

cacheZIndex(props.zIndex)

const emits = defineEmits<UDialogEmits>()
const dialogRef = ref<HTMLDivElement | null>(null)
const dialogHeaderRef = ref<HTMLDivElement | null>(null)

const isCollapsed = ref(false)
const visible = ref<boolean>(props.modelValue ?? false)
const w = ref(props.width)
const h = ref(props.height)

const attrs = useAttrs()

const _closeIcon = computed(() => props.closeIcon || 'close')
const _collapseIcon = computed(() => props.collapseIcon || ['fas', 'chevron-down'])
const _zIndex = ref(props.zIndex)

watch(() => props.modelValue, (val) => {
  if (val !== undefined && val !== visible.value) {
    visible.value = val
  }
})

const initialized = ref(false)

watch(visible, (val) => {
  emits('update:modelValue', val)
  if (val) {
    nextTick(() => {
      initDialogPos()
      if (!initialized.value) {
        initialized.value = true
        setupDialogInteractions()
      }
    })
  }
})

/**
 * 打开弹窗事件
 */
const open = () =>
{
  attrs.open && isFunction(attrs.open) && attrs.open()
  visible.value = true
  emits('open')
}

/**
 * 关闭/取消按钮
 */
const close = () =>
{
  attrs.close && isFunction(attrs.close) && attrs.close()
  visible.value = false
  emits('cancel')
}

/**
 * 确认按钮
 */
const onConfirm = () =>
{
  emits('confirm', () => close())
}

/**
 * 遮罩层点击
 */
const onOverlayClick = () =>
{
  if (props.modal && props.closeOnClickModal)
  
    close()
  
  emits('click-modal')
}

/**
 * 激活弹窗
 */
const onActive = () =>
{
  if (getZIndexs().length < 2 || !isExistBiggerZIndex(_zIndex.value))
    return
  _zIndex.value = getNextZIndex()
  cacheZIndex(_zIndex.value)
}

/**
 * 折叠事件
 */
const onCollapse = () =>
{
  isCollapsed.value = !isCollapsed.value
  const height = isCollapsed.value ? (dialogHeaderRef.value?.getBoundingClientRect().height || 0) + 10 : h.value
  window.requestAnimationFrame(() =>
  {
    dialogRef.value?.style.setProperty('height', `${height}px`)
  })
  emits('collapse', isCollapsed.value)
}

/**
 * ESC快捷键关闭
 */
props.closeOnPressEscape && useEventListener(document, 'keydown', (e: KeyboardEvent) =>
{
  if (e.key === 'Escape')
  {
    e.preventDefault()
    close()
    emits('cancel')
  }
})

/**
 * 挂载弹窗的拖拽与缩放能力（依赖 dialogRef、dialogHeaderRef）
 */
function setupDialogInteractions() {
  if (!dialogRef.value) return
  const rect = dialogHeaderRef.value?.getBoundingClientRect()
  useResize({
    el: dialogRef,
    minWidth: 100,
    minHeight: rect?.height,
    resizing: (width, height) => {
      w.value = width
      h.value = height
      isCollapsed.value = false
    }
  })
  useDraggle({
    el: dialogRef,
    dragEl: dialogHeaderRef,
    isLimitBounds: props.isLimitBounds
  })
}

onMounted(() => {
  if (visible.value) {
    nextTick(() => {
      initDialogPos()
      initialized.value = true
      setupDialogInteractions()
    })
  }
})

/**
 * 初始化弹窗位置
 */
function initDialogPos()
{
  const vw = document.documentElement.clientWidth
  const vh = document.documentElement.clientHeight
  w.value = props.width <= 1 ? vw * props.width : props.width
  h.value = props.height <= 1 ? vh * props.height : props.height
  const top = vh - h.value < 0 ? 0 : (vh - h.value) / 3
  const left = vw - w.value < 0 ? 0 : (vw - w.value) / 2
  window.requestAnimationFrame(() =>
  {
    dialogRef.value?.style.setProperty('top', `${top}px`)
    dialogRef.value?.style.setProperty('left', `${left}px`)
    dialogRef.value?.style.setProperty('width', `${w.value}px`)
    dialogRef.value?.style.setProperty('height', `${h.value}px`)
  })
}

defineExpose<UDialogExposes>({
  open,
  close,
  collapse: onCollapse,
  resetPosition: initDialogPos
})

</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>