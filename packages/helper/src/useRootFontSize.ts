import { debounce, isFunction, type DebounceSettings, type DebouncedFunc } from 'lodash-es'

export interface URootFontSizeOptions {
  // 根字体大小
  rootFontSize?: number
  // 是否开启resize事件, 默认true
  isResize?: boolean
  // resize事件防抖时间, 默认300ms
  resizeTimeout?: number
  // 是否立即执行, 默认false
  immediate?: boolean
  // lodash防抖配置, 默认{}
  debounceOpt?: DebounceSettings
  // 在resize刷新字体大小后执行的回调函数
  afterRefreshCallback?: (rootFontSize: number | undefined) => void
  // 在resize刷新字体大小前执行的回调函数
  beforeRefreshCallback?: (rootFontSize: number | undefined) => void
}

export interface URootFontSizeReturn {
  // 根字体大小
  rootFontSize?: number
  // 销毁resize事件
  destory: () => void
  // 刷新根字体大小
  refreshRootFontSize: () => void
  // 刷新根字体大小防抖
  refreshRootFontSizeDebounce?: DebouncedFunc<() => void>
  // 设置根字体大小
  setRootFontSize: (rootFontSize: number) => void
}

/**
 * 处理根字体大小 rem 响应式布局
 * @author  Yuluo
 * @link    https://github.com/YuluoY
 * @date    2024-08-24
 * @param   {URootFontSizeOptions}    options                             配置项
 * @param   {number}                  [options.rootFontSize=16]           根字体大小
 * @param   {number}                  [options.resizeTimeout=300]         resize事件防抖时间, 默认300ms
 * @param   {boolean}                 [options.isResize=true]             是否开启resize事件, 默认true
 * @param   {boolean}                 [options.immediate=false]           是否立即执行, 默认false
 * @param   {(val:number) => void}    [options.beforeRefreshCallback]     在resize刷新字体大小前执行的回调函数
 * @param   {(val:number) => void}    [options.afterRefreshCallback]      在resize刷新字体大小后执行的回调函数
 * @param   {DebounceSettings}        [options.debounceOpt]               lodash防抖配置, 默认{}
 * @returns {URootFontSizeReturn}
 * @example
 * ```js
 * const {
 *  destory,                      // 销毁resize事件
 *  rootFontSize,                 // 根字体大小
 *  refreshRootFontSize,          // 刷新根字体大小函数
 *  refreshRootFontSizeDebounce,  // lodash的防抖函数
 * } = useRootFontSize({
 *    setRootFontSizeCallback: (rootFontSize) => {
 *      console.log(rootFontSize)
 *    },
 *    immediate: true,
 *    isResize: true,
 *    resizeTimeout: 300,
 *    debounceOpt: {
 *      // lodash防抖配置
 *    }
 * })
 * ```
 */
export function useRootFontSize(options: URootFontSizeOptions): URootFontSizeReturn
{
  const {
    debounceOpt = {} as DebounceSettings,
    immediate = false,
    isResize = true,
    resizeTimeout = 300,
    rootFontSize = window.innerWidth / 100,
    afterRefreshCallback,
    beforeRefreshCallback
  } = options

  let rootFontSizeValue = rootFontSize
  const ratio = rootFontSizeValue / window.innerWidth
  console.log(ratio, window.innerWidth * ratio)
  /**
   * 刷新根字体大小
   */
  const refreshRootFontSize = (): void =>
  {
    isFunction(beforeRefreshCallback) && beforeRefreshCallback(rootFontSizeValue)
    document.documentElement.style.fontSize = `${(window.innerWidth * (rootFontSizeValue / window.innerWidth)) / window.devicePixelRatio}px`
    isFunction(afterRefreshCallback) && afterRefreshCallback(rootFontSizeValue)
  }

  /**
   * 防抖
   */
  const refreshRootFontSizeDebounce = debounce(refreshRootFontSize, resizeTimeout, debounceOpt)

  /**
   * 手动设置根字体大小
   */
  const setRootFontSize = (rootFontSize: number): void =>
  {
    rootFontSizeValue = rootFontSize
    refreshRootFontSize()
  }

  /**
   * 监听resize事件
   */
  isResize && window.addEventListener('resize', refreshRootFontSizeDebounce)

  /**
   * 销毁reszie
   */
  const destory = isResize ? () => window.removeEventListener('resize', refreshRootFontSizeDebounce) : () =>
  {}

  /**
   * 自动初始化执行
   */
  immediate && refreshRootFontSize()

  return {
    destory,
    rootFontSize,
    refreshRootFontSize,
    refreshRootFontSizeDebounce,
    setRootFontSize
  }
}
