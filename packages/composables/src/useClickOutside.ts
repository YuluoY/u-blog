import type { Ref } from 'vue'
import { useEventListener } from './useEventListener'

/**
 *
 * @param eleRef 需要监听的元素
 * @param callback 点击元素外部时触发的事件
 * @description 用于点击元素外部时触发的事件
 * @example
 * ```ts
 * const eleRef = ref(null)
 * useClickOutside(eleRef, (e) => {
 *   console.log(e)
 * })
 * ```
 */
export function useClickOutside(
  eleRef: Ref<HTMLElement | null>,
  callback: (e: MouseEvent) => void
)
{
  useEventListener(document, 'click', (e: Event) =>
  {
    if (eleRef.value && e.target)
    {
      if (!eleRef.value.contains(e.target as HTMLElement))
        callback(e as MouseEvent)
    }
  })
}