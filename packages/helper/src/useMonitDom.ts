import { debounce, omit } from 'lodash-es'

export interface IUseMonitDomOptions extends IntersectionObserverInit {
  /**
   * 是否保持观察
   */
  isKeep?: boolean
  /**
   * 是否立即执行
   */
  isImmediate?: boolean
  /**
   * 防抖时间
   */
  debounceTime?: number
  /**
   * 进入视口回调
   */
  onIntersect?: (entry: IntersectionObserverEntry, value: number) => void
}

export function useMonitDom(
  dom: HTMLElement,
  options: IUseMonitDomOptions = {}
): {
  observer: IntersectionObserver
  unobserve: () => void
  observe: () => void
  disconnect: () => void
  takeRecords: () => IntersectionObserverEntry[]
} | null
{
  if (!dom)
  {
    console.error('dom is required')
    return null
  }

  const { debounceTime = 200 } = options

  let debouncedObserve: () => void

  // 创建观察者
  const observer = new IntersectionObserver(
    callback,
    omit(options, ['root', 'rootMargin', 'threshold']) as IntersectionObserverInit
  )

  function callback(entries: IntersectionObserverEntry[])
  {
    entries.forEach(entry =>
    {
      if (entry.isIntersecting) options.onIntersect?.(entry, entry.intersectionRatio)
    })
  }

  // 立即执行
  if (options.isImmediate) observer.observe(dom)

  // 保持观察
  if (options.isKeep)
  {
    debouncedObserve = debounce(() =>
    {
      // 先停止之前的观察
      unobserve()
      // 重新开始观察
      observe()
    }, debounceTime)

    window.addEventListener('scroll', debouncedObserve, {
      passive: true
    })
  }

  /**
   * 停止观察
   */
  function unobserve()
  {
    observer.unobserve(dom)
  }

  /**
   * 开始观察
   */
  function observe()
  {
    observer.observe(dom)
  }

  /**
   * 断开观察
   */
  function disconnect()
  {
    observer.disconnect()
    window.removeEventListener('scroll', debouncedObserve)
  }

  /**
   * 获取观察记录
   */
  function takeRecords()
  {
    return observer.takeRecords()
  }

  return {
    observer,
    unobserve,
    observe,
    disconnect,
    takeRecords
  }
}
