import { isMobile } from "./isMobile";

/**
 * 判断是否是PC端
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-14
 * @param       {Navigator}      - 可选参数，用于指定要检查的 navigator 对象
 * @return      {boolean}
 * @example
 * ```ts
 *  isPC() // true or false
 * ```
 */
export const isPC = (navigator?: Navigator): boolean => !isMobile(navigator)