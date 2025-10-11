import { customRef } from 'vue'
import { debounce, type DebounceSettings } from 'lodash-es'

/**
 * @author  Yuluo
 * @link    https://github.com/YuluoY
 * @date    2025-09-28
 * @param value 初始值
 * @param delay 延迟时间
 * @param options lodash debounce配置
 * @returns ref对象
 * @example
 * ```ts
 * const debouncedRef = useDebouncedRef('hello', 1000, { leading: true })
 * debouncedRef.value = 'world'
 * console.log(debouncedRef.value) // 'hello'
 * setTimeout(() => {
 *   console.log(debouncedRef.value) // 'world'
 * }, 1000)
 * ```
 */
export function useDebouncedRef<T>(value: T, delay = 200, options: DebounceSettings = {})
{
  const debounceFn = debounce((newValue: T, trigger: () => void) =>
  {
    value = newValue
    trigger()
  }, delay, options)

  return customRef((track, trigger) =>
  {
    return {
      get()
      {
        track()
        return value
      },
      set(newValue)
      {
        debounceFn(newValue, () => trigger())
      }
    }
  })
}