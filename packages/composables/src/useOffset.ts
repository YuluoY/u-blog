import { computed, type Ref } from 'vue'

interface IUseOffsetOptions {
  offset: number;
  boxHeight: Ref<number>;
  getLastBottomOffset: () => number;
}

interface IUseOffsetResult {
  topOffset: Ref<number>;
  bottomOffset: Ref<number>;
}

/**
 *
 * @param options
 * @param options.offset 偏移量
 * @param options.boxHeight 盒子高度
 * @param options.getLastBottomOffset 获取最后一个底部偏移量
 * @description 用于计算偏移量
 * @example
 * ```ts
 * const { topOffset, bottomOffset } = useOffset({
 *   offset: 10,
 *   boxHeight: 100,
 *   getLastBottomOffset: () => 0,
 * })
 * ```
 * @returns
 */
export function useOffset(options: IUseOffsetOptions): IUseOffsetResult
{
  const { offset, boxHeight, getLastBottomOffset } = options

  const lastBottomOffset = computed(() => getLastBottomOffset())
  const topOffset = computed(() => offset + lastBottomOffset.value)
  const bottomOffset = computed(() => topOffset.value + boxHeight.value)
  
  return {
    topOffset,
    bottomOffset
  }
}

export default useOffset