import { computed, ref } from 'vue'

const zIndex = ref(0)

/**
 *
 * @param initVal 初始值（默认 2100，高于 Drawer/Modal 的 z-index 2000）
 * @description 用于生成z-index
 * @example
 * ```ts
 * const { initVal, curZIndex, nextZIndex } = useZIndex()
 * ```
 */
export function useZIndex(initVal = 2100)
{
  const _initVal = ref(initVal)
  const curZIndex = computed(() => zIndex.value + _initVal.value)

  const nextZIndex = () =>
  {
    zIndex.value++
    return curZIndex.value
  }
  
  return {
    initVal,
    curZIndex,
    nextZIndex
  }
}