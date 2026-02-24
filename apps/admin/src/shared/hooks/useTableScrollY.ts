import { useEffect, useState, useRef, useCallback, type RefObject } from 'react'

const TABLE_HEADER_HEIGHT = 55
const PAGINATION_HEIGHT = 64

export interface UseTableScrollYOptions {
  hasPagination?: boolean
  /** 额外需要扣除的元素 ref（如 toolbar），高度动态测量 */
  toolbarRef?: RefObject<HTMLDivElement | null>
}

/**
 * 测量表格容器高度，返回适合 antd Table scroll.y，使表头（与分页）留在视口内、仅表体滚动。
 * 支持传入 toolbarRef，自动扣除 toolbar 占用高度，避免分页被截断。
 */
export function useTableScrollY(options: UseTableScrollYOptions = {}) {
  const { hasPagination = true, toolbarRef } = options
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState(0)

  const update = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const h = el.clientHeight
    const toolbarH = toolbarRef?.current?.offsetHeight ?? 0
    const subtract = TABLE_HEADER_HEIGHT + (hasPagination ? PAGINATION_HEIGHT : 0) + toolbarH
    const y = Math.max(200, h - subtract)
    setScrollY(y)
  }, [hasPagination, toolbarRef])

  useEffect(() => {
    update()
    const container = containerRef.current
    const toolbar = toolbarRef?.current
    if (!container) return
    const ro = new ResizeObserver(update)
    ro.observe(container)
    // 同时观察 toolbar，应对其高度变化（如换行）
    if (toolbar) ro.observe(toolbar)
    return () => ro.disconnect()
  }, [update, toolbarRef])

  return { containerRef, scrollY }
}
