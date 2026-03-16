import { useEffect, useState, useRef, useCallback, type RefObject } from 'react'

/** 表头高度回退值（首次渲染 DOM 尚未就绪时使用） */
const TABLE_HEADER_HEIGHT_FALLBACK = 55
const PAGINATION_HEIGHT = 64

export interface UseTableScrollYOptions {
  hasPagination?: boolean
  /** 额外需要扣除的元素 ref（如 toolbar），高度动态测量 */
  toolbarRef?: RefObject<HTMLDivElement | null>
}

/**
 * 测量表格容器高度，返回适合 antd Table scroll.y，使表头（与分页）留在视口内、仅表体滚动。
 * 动态测量实际表头高度（.ant-table-header），避免硬编码与实际不符导致截断。
 * 支持传入 toolbarRef，自动扣除 toolbar 占用高度。
 */
export function useTableScrollY(options: UseTableScrollYOptions = {}) {
  const { hasPagination = true, toolbarRef } = options
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState(0)

  const update = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const h = el.clientHeight
    // 优先使用 toolbarRef，否则自动检测容器内的 toolbar 元素
    const toolbarEl = toolbarRef?.current ?? el.querySelector<HTMLElement>('.admin-content__toolbar')
    let toolbarH = 0
    if (toolbarEl) {
      const style = getComputedStyle(toolbarEl)
      toolbarH = toolbarEl.offsetHeight + parseFloat(style.marginTop) + parseFloat(style.marginBottom)
    }
    // 动态测量 antd Table 表头实际高度，兼容多行表头、不同列数等场景
    const headerEl = el.querySelector<HTMLElement>('.ant-table-header')
    const headerH = headerEl?.offsetHeight ?? TABLE_HEADER_HEIGHT_FALLBACK
    const subtract = headerH + (hasPagination ? PAGINATION_HEIGHT : 0) + toolbarH
    const y = Math.max(200, h - subtract)
    setScrollY(y)
  }, [hasPagination, toolbarRef])

  useEffect(() => {
    update()
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(update)
    ro.observe(container)
    // 同时观察 toolbar（显式 ref 或自动检测），应对其高度变化（如换行）
    const toolbar = toolbarRef?.current ?? container.querySelector<HTMLElement>('.admin-content__toolbar')
    if (toolbar) ro.observe(toolbar)
    // 延迟再次计算，确保 antd Table 完成渲染后拿到正确表头高度
    const timer = setTimeout(update, 100)
    return () => {
      ro.disconnect()
      clearTimeout(timer)
    }
  }, [update, toolbarRef])

  return { containerRef, scrollY }
}
