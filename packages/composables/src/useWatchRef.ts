import { isFunction } from 'lodash-es'
import { onBeforeUnmount, ref, watch, type Ref, type WatchOptions } from 'vue'

/**
 *
 * @param val 需要监听的值
 * @param watchFn 监听的函数
 * @param change 变化时的回调函数
 * @param watchOpts 监听的配置
 * @description 用于监听一个值的变化
 * @example
 * ```ts
 * const val = ref(0)
 * useWatchRef(val, () => {
 *   console.log(val.value)
 * })
 * ```
 */
export function useWatchRef<T = any>(
  val: T,
  watchFn: () => any,
  change?: () => void,
  watchOpts: WatchOptions = {}
): Ref<T>
{
  const valRef = ref(val) as Ref<T>
  const isChangeFn = change && isFunction(change)
  const watchHandle = watch(watchFn, (newVal: T) =>
  {
    valRef.value = newVal
    isChangeFn && change()
  }, watchOpts)

  onBeforeUnmount(() =>
  {
    watchHandle()
  })

  return valRef
}