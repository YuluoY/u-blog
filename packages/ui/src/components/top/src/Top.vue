<template>
  <Teleport :to="appendTo">
    <Transition
      appear
      :name="animationClass"
    >
      <div
        v-show="visible"
        class="u-top"
        :style="topStyles"
        @click.prevent="handleClick"
      >
        <div class="u-top__inner">
          <slot>
            <h2>TOP</h2>
          </slot>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { type UTopProps, type UTopEmits, type UTopExposes } from '../types'
import { computed, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import { pxToRem } from '@u-blog/utils' 
import { isString } from 'lodash-es'
import { useScrollTo, type UseScrollToReturn } from '@u-blog/composables'
import { CTopPosition } from '../consts'

defineOptions({
  name: 'UTop'
})

const props = withDefaults(defineProps<UTopProps>(), {
  size: 40,
  offset: 50,
  position: 'right',
  scrollThreshold: '50%',
  appendTo: 'body',
  animationClass: 'u-top-slide',
  duration: 500
})
const emits = defineEmits<UTopEmits>()

const visible = ref(props.modelValue || false)
const visibleWatchHandle = watch(visible, val =>
{
  emits('update:modelValue', val)
})
onBeforeUnmount(() =>
{
  visibleWatchHandle && visibleWatchHandle()
})
const container = ref<HTMLElement | null>(null)
const containerScrollAble = ref(0)
let scrollToFn: UseScrollToReturn['scrollTo'] | null = null

const _scrollThreshold = computed(() =>
{
  if (container.value)
    containerScrollAble.value = getSurplusScroll(container.value)
  
  if (isString(props.scrollThreshold))
  {
    const val = parseInt(props.scrollThreshold, 10)
    if (!val)
      return containerScrollAble.value / 3
    return containerScrollAble.value ? val / 100 * containerScrollAble.value : val
  }
  else
  
    return props.scrollThreshold
  
})

const topStyles = computed<CSSProperties>(() =>
{
  const size = pxToRem(props.size)

  let offsetStyle = {
    bottom: pxToRem(props.offset),
    right: pxToRem(props.offset),
  } as CSSProperties
 
  if (props.position === CTopPosition.LEFT)
  {
    offsetStyle = {
      bottom: pxToRem(props.offset),
      left: pxToRem(props.offset)
    }
  }

  return {
    width: size,
    height: size,
    position: 'fixed',
    zIndex: 9999,
    cursor: 'pointer',
    ...offsetStyle
  }
})

const handleClick = (e: Event) =>
{
  scrollToFn?.()
  emits('click', e)
}

onMounted(() =>
{
  container.value = props.appendTo === 'body' ? document.documentElement : document.querySelector(props.appendTo) as HTMLElement
  
  const {
    scrollTo
  } = useScrollTo({
    el: container,
    duration: props.duration,
    isAuto: false,
    scrolling: () => vaildate() ? show() : hide(),
    wheeling: () => vaildate() ? show() : hide()
  })
  
  scrollToFn = scrollTo
  vaildate() ? show() : hide()
})

function getSurplusScroll(el: HTMLElement): number
{
  if (!el)
    return 0
  return el.scrollHeight - el.clientHeight - el.scrollTop
}

/**
 * 是否在阈值内
 */
function vaildate()
{
  if (!container.value)
    return false
  return container.value.scrollTop >= _scrollThreshold.value
}

/**
 * 显示
 */
function show()
{
  visible.value = true
}

/**
 * 隐藏
 */
function hide()
{
  visible.value = false
}

/**
 * 切换显隐
 */
function toggle()
{
  visible.value = !visible.value
}

/**
 * 滚动到指定位置
 */
function scrollTo(to: number = 0, duration: number = 300)
{
  scrollToFn?.(to, duration)
}

/**
 * 滚动置顶
 */
function scrollToTop(duration: number = 300)
{
  scrollToFn?.(0, duration)
}

/**
 * 滚动到底部
 */
function scrollToBottom(duration: number = 300)
{
  scrollToFn?.(container.value?.scrollHeight, duration)
}

/**
 * 滚动到指定元素
 */
function scrollToElement(el: HTMLElement, duration: number = 300)
{
  scrollToFn?.(el.offsetTop, duration)
}


defineExpose<UTopExposes>({
  show,
  hide,
  toggle,
  scrollTo,
  scrollToTop,
  scrollToBottom,
  scrollToElement,
  vaildate,
  get visible()
  {
    return visible.value
  }
})

</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>