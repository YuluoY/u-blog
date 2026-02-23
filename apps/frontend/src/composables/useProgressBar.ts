import { ref } from 'vue'
import type { UProgressBarExposes } from '@u-blog/ui'

/**
 * 全局进度条实例引用 —— 在 LayoutBase 中绑定 ref，其他模块通过此获取控制权
 */
const progressBarRef = ref<UProgressBarExposes | null>(null)

/** 当前正在进行的请求计数 */
let activeRequests = 0

/**
 * 注册进度条实例（在 LayoutBase 中调用）
 */
export function registerProgressBar(instance: UProgressBarExposes | null) {
  progressBarRef.value = instance
}

/**
 * 开始一个请求（递增计数，首次触发 start）
 */
export function startProgress() {
  activeRequests++
  if (activeRequests === 1) {
    progressBarRef.value?.start()
  }
}

/**
 * 完成一个请求（递减计数，归零时触发 done）
 */
export function endProgress() {
  activeRequests = Math.max(0, activeRequests - 1)
  if (activeRequests === 0) {
    progressBarRef.value?.done()
  }
}

/**
 * 请求失败时调用
 */
export function failProgress() {
  activeRequests = Math.max(0, activeRequests - 1)
  if (activeRequests === 0) {
    progressBarRef.value?.fail()
  }
}

/**
 * 获取进度条实例引用（用于模板 ref 绑定）
 */
export function useProgressBar() {
  return { progressBarRef }
}
