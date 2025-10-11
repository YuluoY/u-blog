import { computed, ref } from 'vue'

const zIndex = ref(0)

/**
 *
 * @param initVal 初始值
 * @description 用于生成z-index
 * @example
 * ```ts
 * const { initVal, curZIndex, nextZIndex } = useZIndex()
 * ```
 */
export function useZIndex(initVal = 1100)
{
  const _initVal = ref(initVal)
  const curZIndex = computed(() => zIndex.value + _initVal.value)

  const nextZIndex = () =>
  {
    zIndex.value++
    return zIndex.value
  }
  
  return {
    initVal,
    curZIndex,
    nextZIndex
  }
}