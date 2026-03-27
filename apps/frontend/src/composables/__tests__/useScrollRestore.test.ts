import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * 滚动位置恢复逻辑测试
 *
 * 不直接测试 useScrollRestore composable（需要 Vue Router 完整环境），
 * 而是提取核心逻辑为纯函数进行验证，重点覆盖修复的 ReadView scrollTop 重置时序问题。
 */

// ── 模拟滚动容器 ──
interface MockContainer {
  scrollTop: number
  scrollHeight: number
  clientHeight: number
}

function createMockContainer(scrollHeight = 5000, clientHeight = 800): MockContainer {
  return { scrollTop: 0, scrollHeight, clientHeight }
}

// ── 提取 useScrollRestore 核心逻辑 ──
class ScrollRestoreCore {
  scrollMap = new Map<string, number>()

  /** beforeEach: 保存当前路由的滚动位置 */
  save(fromPath: string, container: MockContainer): void {
    this.scrollMap.set(fromPath, container.scrollTop)
  }

  /**
   * afterEach: 恢复目标路由的滚动位置
   * @returns 是否成功恢复
   */
  restore(toPath: string, container: MockContainer): boolean {
    const saved = this.scrollMap.get(toPath)
    if (!saved) return false
    const maxScroll = container.scrollHeight - container.clientHeight
    if (maxScroll >= saved) {
      container.scrollTop = saved
      return true
    }
    return false
  }
}

// ── ReadView scrollTop 重置逻辑 ──

/** 修复前：无条件重置（离开文章页时也会把 scrollTop 归零） */
function readViewResetBroken(newId: string | undefined, container: MockContainer): void {
  // if (newId) { ...文章加载... }
  // nextTick — 无条件归零
  container.scrollTop = 0
}

/** 修复后：仅在有目标文章时重置 */
function readViewResetFixed(newId: string | undefined, container: MockContainer): void {
  if (newId) {
    // ...文章加载...
    container.scrollTop = 0
  }
}

// ════════════════════════════════════════════
// 测试用例
// ════════════════════════════════════════════

describe('ScrollRestoreCore', () => {
  let sr: ScrollRestoreCore
  let container: MockContainer

  beforeEach(() => {
    sr = new ScrollRestoreCore()
    container = createMockContainer()
  })

  it('保存并恢复滚动位置', () => {
    container.scrollTop = 1200
    sr.save('/', container)

    container.scrollTop = 0
    const ok = sr.restore('/', container)

    expect(ok).toBe(true)
    expect(container.scrollTop).toBe(1200)
  })

  it('无记录路由不恢复', () => {
    container.scrollTop = 500
    const ok = sr.restore('/read/42', container)

    expect(ok).toBe(false)
    expect(container.scrollTop).toBe(500)
  })

  it('saved=0 是 falsy，跳过恢复（页面顶部无需恢复）', () => {
    container.scrollTop = 0
    sr.save('/about', container)

    const ok = sr.restore('/about', container)
    expect(ok).toBe(false)
  })

  it('内容高度不足时不强制恢复', () => {
    const shortContainer = createMockContainer(500, 800)
    shortContainer.scrollTop = 1200
    sr.save('/', shortContainer)

    shortContainer.scrollTop = 0
    const ok = sr.restore('/', shortContainer)
    expect(ok).toBe(false)
  })

  it('多个页面各自独立保存/恢复', () => {
    container.scrollTop = 800
    sr.save('/', container)

    container.scrollTop = 2000
    sr.save('/archive', container)

    container.scrollTop = 0
    sr.restore('/', container)
    expect(container.scrollTop).toBe(800)

    sr.restore('/archive', container)
    expect(container.scrollTop).toBe(2000)
  })
})

describe('ReadView scrollTop 重置时序', () => {
  let sr: ScrollRestoreCore
  let container: MockContainer

  beforeEach(() => {
    sr = new ScrollRestoreCore()
    container = createMockContainer()
  })

  describe('修复前（readViewResetBroken）', () => {
    it('离开文章页时也会把 scrollTop 归零', () => {
      container.scrollTop = 3000

      // Read → Home: beforeEach 保存文章页位置
      sr.save('/read/42', container)

      // ReadView watcher 触发（newId=undefined），无条件归零
      readViewResetBroken(undefined, container)
      expect(container.scrollTop).toBe(0) // 被错误归零了
    })
  })

  describe('修复后（readViewResetFixed）', () => {
    it('进入文章时正确归零', () => {
      container.scrollTop = 1500
      readViewResetFixed('42', container)
      expect(container.scrollTop).toBe(0)
    })

    it('离开文章页时不干扰 scrollTop', () => {
      container.scrollTop = 3000
      readViewResetFixed(undefined, container)
      expect(container.scrollTop).toBe(3000) // 未被归零
    })

    it('文章间切换（Read/5 → Read/10）时归零', () => {
      container.scrollTop = 2000
      readViewResetFixed('10', container)
      expect(container.scrollTop).toBe(0)
    })
  })

  describe('完整 Home → Read → Home 流程', () => {
    it('修复后能正确恢复首页滚动位置', () => {
      // Step 1: 用户在首页滚动到 1500px
      container.scrollTop = 1500

      // Step 2: Home → Read（beforeEach 保存首页位置）
      sr.save('/', container)
      expect(sr.scrollMap.get('/')).toBe(1500)

      // Step 3: ReadView 进入文章，scrollTop 归零
      readViewResetFixed('42', container)
      expect(container.scrollTop).toBe(0)

      // Step 4: 用户在文章页滚动到底部
      container.scrollTop = 3000

      // Step 5: Read → Home（beforeEach 保存文章页位置）
      sr.save('/read/42', container)

      // Step 6: ReadView watcher（newId=undefined），修复后不归零
      readViewResetFixed(undefined, container)
      expect(container.scrollTop).toBe(3000) // 关键：不被干扰

      // Step 7: afterEach 恢复首页位置
      const ok = sr.restore('/', container)
      expect(ok).toBe(true)
      expect(container.scrollTop).toBe(1500)
    })

    it('多次来回导航仍能正确恢复', () => {
      // 第一轮：Home(800) → Read/1 → Home
      container.scrollTop = 800
      sr.save('/', container)
      readViewResetFixed('1', container)
      container.scrollTop = 1000 // 读文章滚到中间
      sr.save('/read/1', container)
      readViewResetFixed(undefined, container)
      sr.restore('/', container)
      expect(container.scrollTop).toBe(800)

      // 第二轮：Home 继续滚到 2000 → Read/2 → Home
      container.scrollTop = 2000
      sr.save('/', container)
      readViewResetFixed('2', container)
      container.scrollTop = 4000
      sr.save('/read/2', container)
      readViewResetFixed(undefined, container)
      sr.restore('/', container)
      expect(container.scrollTop).toBe(2000)
    })
  })
})
