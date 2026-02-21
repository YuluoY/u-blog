<!--
  抽屉：从四边滑入/滑出，v-show + Transition，关闭时在 after-leave 再 emit，保证滑出动画完整。
-->
<template>
  <Teleport :to="appendTo">
    <Transition :name="transitionName" @after-leave="onAfterLeave">
      <div
        v-show="visible"
        class="u-drawer-overlay"
        :class="{ 'u-drawer-overlay--modal': modal }"
        :style="{ zIndex: _zIndex }"
        @click.self="onOverlayClick"
      >
        <div
          ref="drawerRef"
          class="u-drawer"
          :class="[placement]"
          role="dialog"
          aria-modal="true"
          :aria-label="title || undefined"
          :style="panelStyle"
        >
          <header v-if="title || showCloseIcon || $slots.title" class="u-drawer__header">
            <slot name="title">
              <span v-if="title" class="u-drawer__title">{{ title }}</span>
            </slot>
            <button
              v-if="showCloseIcon"
              type="button"
              class="u-drawer__close"
              :aria-label="t('drawer.close')"
              @click="handleClose"
            >
              <u-icon icon="fa-solid fa-times" />
            </button>
          </header>
          <div class="u-drawer__body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="u-drawer__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { UIcon } from '@/components/icon'
import { useLocale } from '@/components/config-provider'
import type { DrawerPlacement, UDrawerEmits, UDrawerExposes, UDrawerProps } from '../types'
import { useEventListener } from '@u-blog/composables'

defineOptions({
  name: 'UDrawer',
  inheritAttrs: false,
})

const props = withDefaults(defineProps<UDrawerProps>(), {
  placement: 'right',
  appendTo: 'body',
  modal: true,
  closeOnClickModal: true,
  closeOnPressEscape: true,
  showCloseIcon: true,
  zIndex: 2000,
})

const emit = defineEmits<UDrawerEmits>()

const { t } = useLocale()
const drawerRef = ref<HTMLElement | null>(null)

// 内部可见状态：仅用于 v-show 与过渡，关闭时先 false 播完动画再在 after-leave 同步到外部
const visible = ref(!!props.modelValue)
const _zIndex = ref(props.zIndex)

const transitionName = computed(() => {
  const map: Record<DrawerPlacement, string> = {
    left: 'u-drawer-slide-left',
    right: 'u-drawer-slide-right',
    top: 'u-drawer-slide-top',
    bottom: 'u-drawer-slide-bottom',
  }
  return map[props.placement]
})

const isHorizontal = computed(() => props.placement === 'left' || props.placement === 'right')

const panelStyle = computed(() => {
  if (isHorizontal.value) {
    const w = props.width != null ? (typeof props.width === 'number' ? `${props.width}px` : props.width) : '360px'
    return { width: w }
  }
  const h = props.height != null ? (typeof props.height === 'number' ? `${props.height}px` : props.height) : '360px'
  return { height: h }
})

watch(
  () => props.modelValue,
  (val) => {
    if (val !== undefined && val !== visible.value) {
      visible.value = !!val
      if (val) emit('open')
    }
  },
  { immediate: true }
)

function handleClose() {
  visible.value = false
}

function onAfterLeave() {
  emit('update:modelValue', false)
  emit('close')
}

function onOverlayClick() {
  if (props.modal && props.closeOnClickModal) handleClose()
}

props.closeOnPressEscape &&
  useEventListener(document, 'keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && visible.value) {
      e.preventDefault()
      handleClose()
    }
  })

defineExpose<UDrawerExposes>({
  close: handleClose,
})
</script>

<style lang="scss" scoped>
@forward '../styles/index.scss';
</style>
