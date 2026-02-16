<!--
  Notification 通知：带标题与关闭按钮的提醒框，支持 type/position/offset/duration，过渡结束后触发 onClose。
-->
<template>
  <Transition name="notification-fade" @after-leave="onDestroy">
    <div
      v-show="visible"
      class="u-notification"
      :class="[`u-notification--${type}`, `u-notification--${position}`]"
      :style="notificationStyle"
      role="alert"
      aria-live="polite"
    >
      <div class="u-notification__header">
        <span class="u-notification__title">{{ title }}</span>
        <button
          type="button"
          class="u-notification__close"
          :aria-label="t('notification.close')"
          @click="close"
        >
          <u-icon icon="close" />
        </button>
      </div>
      <div v-if="message" class="u-notification__content">
        <template v-if="typeof message === 'string'">{{ message }}</template>
        <component v-else :is="message" />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, type CSSProperties } from 'vue'
import type { UNotificationProps } from '../types'
import { useLocale } from '@/components/config-provider'

defineOptions({
  name: 'UNotification'
})

const { t } = useLocale()

const props = withDefaults(defineProps<UNotificationProps>(), {
  type: 'info',
  duration: 4500,
  position: 'top-right',
  offset: 16
})

const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

// 根据 position 设置 top/bottom/left/right 与 zIndex
const notificationStyle = computed<CSSProperties>(() => ({
  zIndex: props.zIndex,
  top: props.position?.startsWith('top') ? `${props.offset}px` : undefined,
  bottom: props.position?.startsWith('bottom') ? `${props.offset}px` : undefined,
  left: props.position?.endsWith('left') ? `${props.offset}px` : undefined,
  right: props.position?.endsWith('right') ? `${props.offset}px` : undefined
}))

function close() {
  visible.value = false
  if (timer) clearTimeout(timer)
  props.onClose?.()
}

function onDestroy() {
  props.onClose?.()
}

onMounted(() => {
  visible.value = true
  if (props.duration > 0) {
    timer = setTimeout(close, props.duration)
  }
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})

defineExpose({
  close
})
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
