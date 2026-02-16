<!--
  Message 消息：Teleport 到 body，支持类型/偏移/持续时间/关闭按钮，悬停暂停计时，ESC 关闭，暴露 close 与 bottomOffset。
-->
<template>
  <Teleport to="body">
    <Transition
      appear
      :name="transitionName"
      @after-leave="!visible && isFunction(onDestroy) && onDestroy()"
    >
      <div
        v-show="visible"
        ref="messageRef"
        role="alert"
        class="u-message"
        :style="messageStyle"
        :class="[
          `u-message--${type}`,
          { 'is-plain': plain },
          { 'is-center': center },
          customClass
        ]"
        @mouseenter="clearTimer"
        @mouseleave="startTimer"
      >
        <div class="u-message-icon">
          <u-icon :icon="_icon" />
        </div>
        <div class="u-message-content">
          <slot>
            <RenderVNode
              v-if="message"
              :vnode="message"
            />
          </slot>
        </div>
        <div
          v-if="showClose"
          class="u-message-close"
        >
          <u-icon
            icon="close"
            @click.stop="onClose"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, computed, onBeforeUnmount, onMounted, ref, type CSSProperties } from 'vue'
import type { UMessageExposes, UMessageProps } from '../types'
import { pxToRem } from '@u-blog/utils'
import { UIcon } from '@/components/icon'
import { bind, delay, isFunction } from 'lodash-es'
import { DefaultIconMap } from '../consts'
import { RenderVNode } from '..'
import { useEventListener, useOffset } from '@u-blog/composables'
import { getLastBottomOffset } from '../methods'
import { useResizeObserver } from '@vueuse/core'

defineOptions({
  name: 'UMessage'
})

const props = withDefaults(defineProps<UMessageProps>(), {
  type: 'info',
  plain: false,
  showClose: true,
  offset: 10,
  duration: 3000,
  center: false,
  transitionName: 'fade-up'
})

const _icon = computed(() => props.icon ?? DefaultIconMap[props.type])
const visible = ref(true)
const messageRef = ref<HTMLElement | null>(null)

// 垂直偏移：依赖 boxHeight 与 getLastBottomOffset 做堆叠
const boxHeight = ref(0)
const {
  topOffset,
  bottomOffset
} = useOffset({
  boxHeight,
  offset: props.offset,
  getLastBottomOffset: bind(getLastBottomOffset, props)
})
const messageStyle = computed<CSSProperties>(() => ({
  top: pxToRem(topOffset.value),
  zIndex: props.zIndex
}))

const visibleWatcher = watch(visible, val =>
{
  if (!val)
    boxHeight.value = -props.offset
})

useEventListener(document, 'keydown', (e: KeyboardEvent) =>
{
  if (e.key === 'Escape' && visible.value)
  
    onClose()
  
})

useResizeObserver(messageRef, () =>
{
  boxHeight.value = messageRef.value!.getBoundingClientRect().height ?? 0
})

onMounted(() =>
{
  onShow()
  startTimer()
})

onBeforeUnmount(() =>
{
  clearTimer()
  visibleWatcher()
})

function onClose()
{
  visible.value = false
}

function onShow()
{
  visible.value = true
}

let timer: number | null = null
function startTimer()
{
  if (props.duration > 0)
    timer = delay(onClose, props.duration)
}

function clearTimer()
{
  if (timer)
    clearTimeout(timer as any)
}

defineExpose<UMessageExposes>({
  close: onClose,
  bottomOffset
})

</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>