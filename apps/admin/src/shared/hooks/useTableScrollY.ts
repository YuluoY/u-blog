import { useEffect, useState, useRef, useCallback } from 'react'

const TABLE_HEADER_HEIGHT = 55
const PAGINATION_HEIGHT = 64

export interface UseTableScrollYOptions {
  hasPagination?: boolean
}

/**
 * 测量表格容器高度，返回适合 antd Table scroll.y，使表头（与分页）留在视口内、仅表体滚动
 */
export function useTableScrollY(options: UseTableScrollYOptions = {}) {
  const { hasPagination = true } = options
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState(0)

  const update = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const h = el.clientHeight
    const subtract = TABLE_HEADER_HEIGHT + (hasPagination ? PAGINATION_HEIGHT : 0)
    const y = Math.max(200, h - subtract)
    setScrollY(y)
  }, [hasPagination])

  useEffect(() => {
    update()
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [update])

  return { containerRef, scrollY }
}
