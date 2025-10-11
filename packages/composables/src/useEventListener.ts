import { isRef, onBeforeUnmount, onMounted, unref, watch } from 'vue'
import type { Ref, WatchStopHandle, MaybeRef } from 'vue'

/**
 *
 * @param target 需要监听的元素
 * @param event 事件类型
 * @param handler 事件处理函数
 * @description 用于监听元素的事件
 * @example
 * ```ts
 * useEventListener(document, 'click', (e) => {
 *   console.log(e)
 * })
 * ```
 */
export function useEventListener(
  target: MaybeRef<EventTarget | HTMLElement | null | void>,
  event: string,
  handler: (e: any) => any
)
{

  if (!target)
    return
  
  let targetWatchHandle: WatchStopHandle | void

  if (isRef(target))
  {
    targetWatchHandle = watch((target as Ref<HTMLElement>), (newVal: HTMLElement, oldVal: HTMLElement) =>
    {
      oldVal?.removeEventListener(event, handler)
      newVal?.addEventListener(event, handler)
    }, { immediate: true })
  }
  else
  
    onMounted(() => target?.addEventListener(event, handler))
  

  onBeforeUnmount(() =>
  {
    targetWatchHandle && targetWatchHandle()
    unref(target as HTMLElement)?.removeEventListener(event, handler)
  })
}