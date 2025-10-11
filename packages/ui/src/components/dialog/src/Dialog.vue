
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
        :aria-describedby="uid"
      >
        <div
          ref="dialogHeaderRef"
          class="u-dialog__header"
          @click="onActive"
        >
          <div class="u-dialog__title">
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
              v-if="isString(content)"
              v-html="content"
            />
            <component
              :is="content"
              v-else
            />
          </slot>
        </div>
        <div
          v-if="showFooter"
          class="u-dialog__footer custom-scollbar"
        >
          <slot name="footer">
            <u-button type="primary" @click="onConfirm">确认</u-button>
            <u-button plain @click="close">取消</u-button>
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch, useId } from 'vue'
import type { UDialogEmits, UDialogExposes, UDialogProps } from '../types'
import { useEventListener, useResize, useDraggle } from '@u-blog/composables'
import { UIcon, UButton } from '@/components'
import { isFunction, isString } from 'lodash-es'
import { cacheZIndex, getNextZIndex, getZIndexs, isExistBiggerZIndex } from '../cache'

defineOptions({
  name: 'UDialog',
  inheritAttrs: false
})

const props = withDefaults(defineProps<UDialogProps>(), {
  content: '弹窗内容',
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

cacheZIndex(props.zIndex)

const emits = defineEmits<UDialogEmits>()
const dialogRef = ref<HTMLDivElement | null>(null)
const dialogHeaderRef = ref<HTMLDivElement | null>(null)

const isCollapsed = ref(false)
const visible = ref<boolean>(props.modelValue || true)
const w = ref(props.width)
const h = ref(props.height)

const tW = document.documentElement.clientWidth
const tH = document.documentElement.clientHeight

const attrs = useAttrs()

const _closeIcon = computed(() => props.closeIcon || 'close')
const _collapseIcon = computed(() => props.collapseIcon || ['fas', 'chevron-down'])
const _zIndex = ref(props.zIndex)

const visibleWatchHandle = watch(visible, val =>
{
  emits('update:modelValue', val)
})

onBeforeUnmount(() =>
{
  visibleWatchHandle()
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

onMounted(() =>
{
  const rect = dialogHeaderRef.value?.getBoundingClientRect()
  /**
   * 初始化位置
   */
  initDialogPos()
  /**
   * 改变弹窗大小
   */
  useResize({
    el: dialogRef,
    minWidth: 100,
    minHeight: rect?.height,
    resizing: (width, height) =>
    {
      w.value = width
      h.value = height
      isCollapsed.value = false
    }
  })
  /**
   * 拖拽移动弹窗
   */
  useDraggle({
    el: dialogRef,
    dragEl: dialogHeaderRef,
    isLimitBounds: props.isLimitBounds
  })
})

/**
 * 初始化弹窗位置
 */
function initDialogPos()
{
  if (w.value <= 1)
    w.value = tW * w.value
  if (h.value <= 1)
    h.value = tH * h.value
  const top = tH - h.value < 0 ? 0 : (tH - h.value) / 3
  const left = tW - w.value < 0 ? 0 : (tW - w.value) / 2
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