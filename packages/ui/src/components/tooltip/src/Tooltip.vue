<!--
  Tooltip 气泡提示：基于 Popper.js，支持 hover/click、虚拟触发器、placement/箭头，Teleport 到统一容器。
-->
<template>
  <div
    ref="containerRef"
    :class="['u-tooltip', `u-tooltip--${effect}`]"
    v-on="outerEvents"
  >
    <div
      v-if="!virtualTriggering"
      ref="_triggerRef"
      :data-popper-uid="instance?.uid"
      class="u-tooltip__trigger"
      v-on="events"
    >
      <slot>
        <span
          v-if="rawContent"
          class="u-tooltip__trigger-content"
          v-html="content"
        />
        <span
          v-else
          class="u-tooltip__trigger-content"
        >{{ content }}</span>
      </slot>
    </div>

    <slot
      v-else
      name="default"
    />

    <teleport :to="`#${String(CTooltipContainerId)}`">
      <div
        :id="`popper-uid-${instance?.uid}`"
        ref="popperContainerRef"
        :class="['u-tooltip', `u-tooltip--${effect}`]"
      >
        <transition
          :name="transition"
          v-bind="transitionProps ?? void 0"
          @after-leave="destroyPopperInstance"
        >
          <div
            v-if="visible"
            ref="popperRef"
            :class="['u-tooltip__popper', `u-tooltip__popper--${placement}`, popperClass]"
            :style="popperStyles"
            v-on="dropdownEvents"
          >
            <slot name="content">
              <span
                v-if="rawContent"
                v-html="content"
              />
              <template v-else>
                {{ content }}
              </template>
            </slot>
            <div
              v-if="showArrow"
              class="u-tooltip__popper--arrow"
              data-popper-arrow
            />
          </div>
        </transition>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  isRef,
  mergeProps,
  onBeforeUnmount,
  ref,
  watch,
  watchEffect,
  type Ref,
} from 'vue'
import type { UTooltipEmits, UTooltipExposes, UTooltipProps } from '../types'
import { type Options, type Instance, createPopper } from '@popperjs/core'
import { debounce, type DebouncedFunc, bind, isNil } from 'lodash-es'
import { useClickOutside, useEventListener } from '@u-blog/composables'
import { pxToRem } from '@u-blog/utils'
import {
  CTooltipContainerId,
  CTooltipTrigger
} from '../consts'

defineOptions({
  name: 'UTooltip',
})

const instance = getCurrentInstance()

const props = withDefaults(defineProps<UTooltipProps>(), {
  width: 0, // 0 表示由内容撑开（max-content），固定宽度请传正整数
  rawContent: false,
  padding: 14,
  placement: 'bottom',
  trigger: 'hover',
  effect: 'default',
  transition: 'fade',
  showTimeout: 0,
  hideTimeout: 300,
  borderRadius: 0.5,
  popperOptions: () => ({}),
})
const emits = defineEmits<UTooltipEmits>()

const popperStyles = computed(() => {
  const r = props.borderRadius ?? 0.5
  const radiusPx = `${Math.round(r * 16)}px`
  const useAutoWidth = props.width == null || props.width <= 0
  const base: Record<string, string> = {
    width: useAutoWidth ? 'max-content' : pxToRem<string>(props.width),
    padding: pxToRem<string>(props.padding),
    borderRadius: radiusPx,
    '--u-tooltip-popper-radius': radiusPx,
  }
  if (props.fontSize != null && props.fontSize > 0)
    base['--u-tooltip-font-size'] = pxToRem<string>(props.fontSize)
  return base
})
const visible = ref<boolean>(!!props.visible)

const containerRef = ref<HTMLDivElement | null>(null)
const _triggerRef = ref<HTMLDivElement | null>(null)
const popperRef = ref<HTMLDivElement | null>(null)
const popperContainerRef = ref<HTMLDivElement | null>(null)

const triggerRef = computed(() =>
{
  if (props.virtualTriggering)
  {
    return (
      (isRef(props.virtualRef) ? props.virtualRef.value : props.virtualRef) ??
      triggerRef.value
    )
  }
  return _triggerRef.value as HTMLElement
}) as Ref<HTMLElement | null>

type IEvent = Ref<Record<string, EventListener>>;
const events: IEvent = ref({})
const outerEvents: IEvent = ref({})
const dropdownEvents: IEvent = ref({})

const popperOptions = computed<Partial<Options>>(() =>
{
  const modifiers: Options['modifiers'] = [
    { name: 'offset', options: { offset: [0, 9] } },
    ...(props.showArrow ? [{ name: 'arrow', options: { padding: 8 } }] : []),
  ]
  const defOpts: Partial<Options> = {
    placement: props.placement,
    modifiers,
  }
  return mergeProps(defOpts, props.popperOptions || {}) as Partial<Options>
})

let onOpenDebounce: DebouncedFunc<() => void>
let onCloseDebounce: DebouncedFunc<() => void>

const openDelay = computed(() =>
  props.trigger === CTooltipTrigger.HOVER ? props.showTimeout : 0
)
const closeDelay = computed(() =>
  props.trigger === CTooltipTrigger.HOVER ? props.hideTimeout : 0
)

let popperInstance: Ref<Instance | null> = ref(null)

function onOpen()
{
  onCloseDebounce?.cancel()
  onOpenDebounce?.()
}

function onClose()
{
  onOpenDebounce?.cancel()
  onCloseDebounce?.()
}

function onHide()
{
  onOpenDebounce?.cancel()
  setVisible(false)
}

function onTogglePopper()
{
  visible.value ? onClose() : onOpen()
}

function setVisible(val: boolean)
{
  if (props.disabled) return
  visible.value = val
  emits('visible-change', val)
  emits('update:visible', val)
}

function destroyPopperInstance()
{
  if (isNil(popperInstance.value)) return
  popperInstance.value.destroy()
  popperInstance.value = null
}

function onAttachEvents()
{
  if (props.disabled || props.manual) return
  if (props.trigger === CTooltipTrigger.HOVER)
  {
    events.value['mouseenter'] = onOpen
    outerEvents.value['mouseleave'] = onClose
    dropdownEvents.value['mouseenter'] = onOpen
    dropdownEvents.value['mouseleave'] = onClose
    return
  }
  if (props.trigger === CTooltipTrigger.CLICK)
  {
    events.value['click'] = onTogglePopper
    return
  }
  if (props.trigger === CTooltipTrigger.CONTEXTMENU)
  {
    events.value['contextmenu'] = (e: Event) =>
    {
      e.preventDefault()
      onOpen()
    }
  }
}

function resetEvents()
{
  events.value = {}
  outerEvents.value = {}
  dropdownEvents.value = {}

  onAttachEvents()
}

function updatePopper()
{
  if (popperInstance.value)
  
    popperInstance.value.update()
  
}

// 点击外部关闭：同时排除触发器区域和弹出容器，避免 teleport 导致 click-outside 误判
useEventListener(document, 'click', (e: Event) =>
{
  if (props.trigger === CTooltipTrigger.HOVER || props.manual) return
  if (!visible.value) return
  const target = e.target as HTMLElement
  // 点击在弹出层内部 → 忽略（多选下拉等场景需保持打开）
  if (popperContainerRef.value?.contains(target)) return
  // 点击在触发器内部 → 忽略（由 onTogglePopper 处理切换）
  if (containerRef.value?.contains(target)) return
  onClose()
})

const visibleWatch = watch(
  visible,
  val =>
  {
    if (!val) return
    if (triggerRef.value && popperRef.value)
    {
      popperInstance.value = createPopper(
        triggerRef.value,
        popperRef.value,
        popperOptions.value
      )
    }
  },
  { flush: 'post' }
)

const manualWatch = watch(
  () => props.manual,
  val =>
  {
    val ? resetEvents() : onAttachEvents()
  }
)

const triggerWatch = watch(
  () => props.trigger,
  (newVal, oldVal) =>
  {
    if (newVal === oldVal) return
    onOpenDebounce?.cancel()
    setVisible(false)
    emits('visible-change', false)
    resetEvents()
  }
)

const tooltipWatchEffect = watchEffect(() =>
{
  if (!props.manual)
  
    onAttachEvents()
  
  onOpenDebounce = debounce(bind(setVisible, null, true), openDelay.value)
  onCloseDebounce = debounce(bind(setVisible, null, false), closeDelay.value)
})

onBeforeUnmount(() =>
{
  visibleWatch()
  manualWatch()
  triggerWatch()
  tooltipWatchEffect()
  destroyPopperInstance()
})

defineExpose<UTooltipExposes>({
  onOpen,
  onClose,
  hide: onHide,
  updatePopper,
  popperRef: popperInstance,
  contentRef: ref(null),
  isFocusInsideContent: () => void 0,
})
</script>

<style lang="scss">
@forward "../styles/index.scss";
</style>
