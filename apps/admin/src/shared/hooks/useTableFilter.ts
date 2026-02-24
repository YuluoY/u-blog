import { useMemo, useState, useCallback } from 'react'
import type { TablePaginationConfig } from 'antd'

/**
 * 通用表格筛选 Hook
 * 提供关键字搜索 + 统一分页配置（含 pageSize 选择器）
 *
 * @param dataSource 原始数据
 * @param searchFields 参与搜索的字段名（支持嵌套取值，用 render 函数）
 * @param options 额外选项
 */
export function useTableFilter<T>(
  dataSource: T[],
  searchFields: (keyof T | ((item: T) => string))[],
  options: { defaultPageSize?: number } = {},
) {
  const { defaultPageSize = 20 } = options
  const [keyword, setKeyword] = useState('')
  const [pageSize, setPageSize] = useState(defaultPageSize)

  /** 根据关键字过滤数据（大小写不敏感） */
  const filteredData = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    if (!kw) return dataSource
    return dataSource.filter((item) =>
      searchFields.some((field) => {
        const val = typeof field === 'function' ? field(item) : item[field]
        return val != null && String(val).toLowerCase().includes(kw)
      }),
    )
  }, [dataSource, keyword, searchFields])

  /** 搜索回调 */
  const onSearch = useCallback((value: string) => {
    setKeyword(value)
  }, [])

  /** 统一分页配置 */
  const pagination: TablePaginationConfig = useMemo(() => ({
    pageSize,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (total: number) => `共 ${total} 条`,
    onShowSizeChange: (_: number, size: number) => setPageSize(size),
  }), [pageSize])

  return {
    keyword,
    setKeyword,
    filteredData,
    onSearch,
    pagination,
  }
}
