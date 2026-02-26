import { nextTick, onBeforeUnmount } from 'vue'
import { useRouter, type Router } from 'vue-router'

/**
 * 滚动位置记忆与恢复
 *
 * 针对自定义滚动容器（如 .layout-base__main，overflow-y: auto），
 * Vue Router 的 scrollBehavior 仅控制 window 级滚动，无法作用于内部容器。
 * 本 composable 通过 router guard 在路由切换前保存、切换后恢复滚动位置。
 *
 * 恢复策略：使用 rAF 重试，等待懒加载组件 + Suspense 渲染完成后
 * 再设置 scrollTop，避免内容尚未撑开时设置被静默忽略。
 *
 * @param selector - 滚动容器的 CSS 选择器
 */
export function useScrollRestore(selector: string = '.layout-base__main') {
  const router: Router = useRouter()

  // 以 route.fullPath 为 key 存储滚动位置
  const scrollMap = new Map<string, number>()

  // DEV 调试：暴露到 window 方便测试
  if (import.meta.env.DEV) {
    ;(window as any).__scrollRestoreDebug = {
      scrollMap,
      logs: [] as Array<{ action: string; path: string; scrollTop: number; time: number }>
    }
  }

  // 路由切换前：保存当前滚动位置
  const removeBeforeGuard = router.beforeEach((_, from) => {
    const el = document.querySelector(selector)
    if (el) {
      scrollMap.set(from.fullPath, el.scrollTop)
      if (import.meta.env.DEV) {
        ;(window as any).__scrollRestoreDebug?.logs.push({
          action: 'save', path: from.fullPath, scrollTop: el.scrollTop, time: Date.now()
        })
      }
    }
  })

  // 路由切换后：恢复目标路由的滚动位置
  const removeAfterGuard = router.afterEach((to) => {
    const saved = scrollMap.get(to.fullPath)
    // 无记录或为 0 时不需要恢复（默认就是顶部）
    if (!saved) return

    let retries = 0
    const MAX_RETRIES = 30 // 约 500ms @60fps，覆盖懒加载 + Suspense 的渲染延迟

    const tryRestore = () => {
      const el = document.querySelector(selector)
      if (!el) return

      // 内容已渲染足够高度，可以安全恢复滚动位置
      const maxScroll = el.scrollHeight - el.clientHeight
      if (maxScroll >= saved) {
        el.scrollTop = saved
        return
      }

      // 内容尚未撑开，继续等待
      if (retries++ < MAX_RETRIES) {
        requestAnimationFrame(tryRestore)
      }
    }

    // nextTick 确保 Vue 响应式更新完成后再开始尝试
    nextTick(() => {
      requestAnimationFrame(tryRestore)
    })
  })

  // 组件卸载时移除 guard，避免内存泄漏
  onBeforeUnmount(() => {
    removeBeforeGuard()
    removeAfterGuard()
  })

  return { scrollMap }
}
