import { toDOM } from '@u-blog/utils' 
import { isFunction } from 'lodash-es'
import { onBeforeUnmount, readonly, ref, type Ref } from 'vue'

export interface UseScrollToOptions {
  el: string | HTMLElement | Ref<HTMLElement | null>
  to?: number
  toReferEl?: string | HTMLElement | Ref<HTMLElement | null>
  duration?: number
  isAuto?: boolean
  scrolling?: (scrollTop: number, progress: number) => void
  wheeling?: (e: WheelEvent) => void
}

export interface UseScrollToReturn {
  scrollStart: Readonly<Ref<number>>
  scrollDistance: Readonly<Ref<number>>
  scrollDistanceSurplus: Readonly<Ref<number>>
  scrollProgress: Readonly<Ref<number>>
  isScolling: Readonly<Ref<boolean>>
  scrollTo: (top?: number, duration?: number) => void
  cancel: () => void
}

/**
 *
 * @param opts
 * @param opts.el 需要滚动的元素
 * @param opts.to 滚动到的位置
 * @param opts.toReferEl 滚动到的参考元素
 * @param opts.duration 滚动时间
 * @param opts.isAuto 是否自动滚动
 * @param opts.scrolling 滚动过程中的回调函数
 * @param opts.wheeling 滚动过程中的回调函数
 * @description 用于滚动到指定位置
 * @example
 * ```ts
 * const { scrollTo, cancel, scrollStart, scrollDistance, scrollDistanceSurplus, scrollProgress, isScolling } = useScrollTo({
 *   el: '#app',
 *   to: 100,
 *   toReferEl: '#referEl',
 *   duration: 300,
 *   isAuto: true,
 *   scrolling: (scrollTop, progress) => {
 *     console.log(scrollTop, progress)
 *   },
 * })
 * ```
 * @returns
 */
export function useScrollTo(opts: UseScrollToOptions): UseScrollToReturn
{
  let {
    el,
    to = 0,
    toReferEl,
    isAuto = true,
    duration = 300,
    scrolling,
    wheeling
  } = opts

  const scrollingFn = scrolling && isFunction(scrolling) ? scrolling : null
  const wheelingFn = wheeling && isFunction(wheeling) ? wheeling : null
  const target = toDOM(el)

  if (!target)
  
    throw new Error('useScrollTo: target is not found')
  

  const referEl = toDOM(toReferEl!)
  if (referEl)
  
    to = referEl.offsetTop
  

  // 滚动起点
  const scrollStart = ref(0)
  // 总滚动距离
  const scrollDistance = ref(0)
  // 剩余滚动距离
  const scrollDistanceSurplus = ref(0)
  // 滚动百分比
  const scrollProgress = ref(0)

  const isScolling = ref(false)
  const isCancel = ref(false)
  const currentAnimation = ref<ReturnType<typeof requestAnimationFrame> | null>(null)

  const scrollTo = (top: number = 0, duration: number = 300) =>
  {
    if (isScolling.value)
    
      return
    
    scrollStart.value = target.scrollTop
    scrollDistance.value = top - scrollStart.value
    scrollDistanceSurplus.value = scrollDistance.value
    const startTime = Date.now()

    isScolling.value = true
    isCancel.value = false

    const scroll = () =>
    {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      target.scrollTop = scrollStart.value + scrollDistance.value * progress

      scrollDistanceSurplus.value = target.scrollTop
      scrollProgress.value = progress * 100

      scrollingFn && scrollingFn(target.scrollTop, progress)

      if (progress < 1 && !isCancel.value)
      
        currentAnimation.value = requestAnimationFrame(scroll)
      
      else
      
        isScolling.value = false
      
    }
    currentAnimation.value = requestAnimationFrame(scroll)
  }

  const cancel = () =>
  {
    isCancel.value = true
    isScolling.value = false
    currentAnimation.value && cancelAnimationFrame(currentAnimation.value)
  }

  const handleWheel = (e: WheelEvent) =>
  {
    if (isScolling.value)
    
      cancel()
    
    wheelingFn && wheelingFn(e)
  }
  target.addEventListener('wheel', handleWheel, { passive: false })

  onBeforeUnmount(() =>
  {
    target.removeEventListener('wheel', handleWheel)
  })

  isAuto && scrollTo(to, duration)

  return {
    scrollTo: scrollTo.bind(null, to, duration),
    cancel,
    scrollStart: readonly(scrollStart),
    scrollDistance: readonly(scrollDistance),
    scrollProgress: readonly(scrollProgress),
    scrollDistanceSurplus: readonly(scrollDistanceSurplus),
    isScolling: readonly(isScolling)
  }
}