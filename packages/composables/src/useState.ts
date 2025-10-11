import { shallowRef, toValue, shallowReadonly } from 'vue'
import type { ShallowRef } from 'vue'

/**
 * @author  Yuluo
 * @link    https://github.com/YuluoY
 * @date    2025-09-27
 * @param target 初始值
 * @param change 变化回调
 * @returns 状态和设置状态函数
 * @example
 * ```ts
 * const [state, setState] = useState('hello')
 * setState('world')
 * console.log(state.value) // 'world'
 *
 * const [state, setState] = useState(() => 'hello')
 * setState(_ => 'world')
 * ```
 */
export const useState = <T>(
  target: T,
  change?: (newState: T) => void
): readonly [ShallowRef<T>, (newState: T) => void] =>
{
  const state = shallowRef<T>(toValue(target))
  
  const setState = <K extends T>(newState: K) =>
  {
    newState = toValue(newState)
    if (Object.is(state.value, newState))
      return
    state.value = newState
    change?.(newState)
  }

  return shallowReadonly([
    state,
    setState
  ])
}