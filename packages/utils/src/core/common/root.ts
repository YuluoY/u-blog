declare const global: typeof globalThis

/**
 * window对象 - 兼容
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-08-24
 * @constant    {Window | null} root
 * @description 获取window对象，兼容浏览器、node、webworker等环境
 */
export const root: Window | null =
  typeof window === 'object' && window.Object === Object
    ? window
    : typeof globalThis === 'object' && globalThis.Object === Object
      ? globalThis
      : typeof global === 'object' && global.Object === Object
        ? global
        : typeof self === 'object' && self.Object === Object
          ? self
          : Function('return this')()