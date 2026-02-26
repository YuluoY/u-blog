import type { Component, ShallowRef } from 'vue'
import { ref, shallowRef } from 'vue'

/**
 * 移动端 TOC（目录）通信机制
 *
 * ReadView 通过 setMobileToc 暴露 Catalog 组件、scrollElement、hasHeadings 状态；
 * MobileBottomNav / MobileTocSheet 通过 useMobileToc 消费。
 *
 * 采用模块级响应式单例（而非 provide/inject），
 * 因为 MobileBottomNav 与 ReadView 在组件树中是兄弟关系，不存在祖先-后代关系。
 */

export interface MobileTocContext {
  /** MdCatalog 组件实例 */
  Catalog: ShallowRef<Component | null>
  /** 滚动容器元素引用 */
  scrollElement: ShallowRef<HTMLElement | undefined>
  /** 文章是否包含标题 */
  hasHeadings: import('vue').Ref<boolean>
  /** 底部抽屉是否展开 */
  sheetVisible: import('vue').Ref<boolean>
}

/** 模块级单例，全局共享 */
const tocState: MobileTocContext = {
  Catalog: shallowRef(null),
  scrollElement: shallowRef(undefined),
  hasHeadings: ref(false),
  sheetVisible: ref(false),
}

/**
 * 由 ReadView 调用，设置当前文章的目录数据
 */
export function setMobileToc(
  Catalog: ShallowRef<Component | null>,
  scrollElement: ShallowRef<HTMLElement | undefined>,
  hasHeadings: import('vue').Ref<boolean>,
) {
  tocState.Catalog = Catalog
  tocState.scrollElement = scrollElement
  tocState.hasHeadings = hasHeadings
}

/**
 * 由 ReadView 在 unmount 时调用，清理目录数据
 */
export function clearMobileToc() {
  tocState.Catalog = shallowRef(null)
  tocState.scrollElement = shallowRef(undefined)
  tocState.hasHeadings = ref(false)
  tocState.sheetVisible.value = false
}

/**
 * 由 MobileBottomNav / MobileTocSheet 调用，消费目录数据
 */
export function useMobileToc(): MobileTocContext {
  return tocState
}
