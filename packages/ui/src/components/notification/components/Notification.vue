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
        <div class="u-notification__header-left">
          <!-- 类型图标 -->
          <u-icon v-if="typeIcon" :icon="typeIcon" class="u-notification__icon" :class="`u-notification__icon--${type}`" />
          <span class="u-notification__title">{{ title }}</span>
          <!-- 去重计数徽标 -->
          <span v-if="repeatCount > 1" class="u-notification__badge">×{{ repeatCount }}</span>
        </div>
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
import { UIcon } from '@/components/icon'

defineOptions({
  name: 'UNotification'
})

const { t } = useLocale()

/** type → icon 映射 */
const CTypeIconMap: Record<string, string> = {
  info: 'fa-solid fa-circle-info',
  success: 'fa-solid fa-circle-check',
  warning: 'fa-solid fa-triangle-exclamation',
  error: 'fa-solid fa-circle-xmark',
}

const props = withDefaults(defineProps<UNotificationProps>(), {
  type: 'info',
  duration: 4500,
  position: 'top-right',
  offset: 16
})

const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

/** 去重计数 */
const repeatCount = ref(1)

/** 内部可动态更新的 offset（用于多通知堆叠） */
const internalOffset = ref(props.offset)

/** 根据 type 获取对应图标 */
const typeIcon = computed(() => CTypeIconMap[props.type ?? 'info'] ?? '')

// 根据 position 设置 top/bottom/left/right 与 zIndex
const notificationStyle = computed<CSSProperties>(() => {
  const isTop = props.position?.startsWith('top')
  const isLeft = props.position?.endsWith('left')
  return {
    zIndex: props.zIndex,
    // 垂直方向使用 internalOffset（支持动态堆叠）
    top: isTop ? `${internalOffset.value}px` : undefined,
    bottom: !isTop ? `${internalOffset.value}px` : undefined,
    // 水平方向固定 16px 边距
    left: isLeft ? '16px' : undefined,
    right: !isLeft ? '16px' : undefined,
    // 关闭时偏移过渡流畅
    transition: 'top 0.3s ease, bottom 0.3s ease, opacity 0.3s ease, transform 0.3s ease',
  }
})

/** 关闭通知：仅触发离开动画，清理交给 @after-leave */
function close() {
  visible.value = false
  if (timer) clearTimeout(timer)
}

/** 过渡结束后通知父级执行销毁 */
function onDestroy() {
  props.onClose?.()
}

/** 动态更新偏移（堆叠排列时由 manager 调用） */
function setOffset(val: number) {
  internalOffset.value = val
}

/** 增加重复计数并重置自动关闭定时器 */
function incrementRepeat() {
  repeatCount.value++
  // 重置定时器，重新开始倒计时
  if (timer) clearTimeout(timer)
  if (props.duration > 0) {
    timer = setTimeout(close, props.duration)
  }
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
  close,
  setOffset,
  incrementRepeat,
})
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>
