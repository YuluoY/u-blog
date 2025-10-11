import { pick } from 'lodash-es'
import type { CSSProperties, Ref, Reactive, ComputedRef } from 'vue'
import { toValue, reactive, shallowRef, computed, nextTick, watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

type TragetType = HTMLElement | Ref<HTMLElement> | (() => HTMLElement) | ComputedRef<HTMLElement>

export const useFixed = ({
  target,
  top,
  zIndex,
  offsetTop
}: {
  target: TragetType
  top?: number
  zIndex?: number
  offsetTop?: number
}): {
  effectStyle: Reactive<CSSProperties>
  relayout: () => void
  init: () => Promise<void>
  destory: () => void
} | null =>
{
  const targetValue = toValue(target) as HTMLElement

  if (!targetValue)
  {
    console.error('target is required')
    return null
  }

  top ??= 20
  zIndex ??= 1000
  offsetTop ??= 0

  top += offsetTop

  const effectStyle = reactive<CSSProperties>({})

  const route = useRoute()
  const rect = shallowRef<DOMRect | null>(null)
  const rawStyle = shallowRef<CSSProperties>({})
  const rawTop = computed(() => rect.value?.top! + window.scrollY - offsetTop)
  const props = ['position', 'top', 'left', 'width', 'height']

  const init = async() =>
  {
    props.forEach(prop => targetValue.style.removeProperty(prop))
    await nextTick()
    rawStyle.value = pick(getComputedStyle(targetValue as HTMLElement) as unknown as CSSProperties, props)
    rect.value = pick(targetValue.getBoundingClientRect(), props) as DOMRect

    targetValue.style.setProperty('width', `${rect.value.width}px`)
    targetValue.style.setProperty('height', `${rect.value.height}px`)
  }

  const relayout = () =>
  {
    if (window.scrollY >= rawTop.value && effectStyle.position !== 'fixed')
    {
      Object.assign(effectStyle, {
        position: 'fixed',
        top: `${top}px`,
        left: rect.value?.left + 'px'
      })
    }
    else if (window.scrollY < rawTop.value && effectStyle.position !== rawStyle.value.position)
    {
      Object.assign(effectStyle, {
        position: rawStyle.value.position,
        top: rawStyle.value.top,
        left: rawStyle.value.left
      })
    }
  }

  const targetStyleWatcher = watch(effectStyle, (newStyle: CSSProperties) => window.requestAnimationFrame(() => Object.assign(targetValue.style, newStyle)))
  const routeWatcher = watch(route, () => init().then(() => relayout()))

  const destory = () =>
  {
    window.removeEventListener('scroll', relayout)
    targetStyleWatcher()
    routeWatcher()
  }

  init().then(() => relayout())

  window.addEventListener('scroll', relayout, { passive: true })
  onBeforeUnmount(() => destory())

  return {
    effectStyle,
    init,
    relayout,
    destory
  }
}