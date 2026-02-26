import { useRef, useState, useMemo, useCallback } from 'react'
import { Table, Button, Popconfirm, Tooltip, Input, Tag, Select, Space } from 'antd'
import { DownloadOutlined, SearchOutlined, FilterOutlined, CloseCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import { useTableFilter } from '../../shared/hooks/useTableFilter'
import { formatDateTime, formatDateRelative } from '../../shared/utils/formatDate'
import { exportToJSON } from '../../shared/utils/exportData'
import { WriteAction } from '../../shared/components/WriteAction'
import { useGuestMode } from '../../contexts/GuestModeContext'
import { useViews } from './useViews'
import { useViewMutations } from './useViewMutations'
import type { ViewItem } from './api'

/** 浏览记录管理页面（只读 + 删除 + IP 过滤） */
export default function ViewsPage() {
  const { data: list = [], isLoading } = useViews()
  const { remove } = useViewMutations()
  const { isGuest } = useGuestMode()
  const { filteredData: searchFiltered, onSearch, pagination } = useTableFilter(
    list,
    ['id', 'ip', 'address', 'agent'] as (keyof ViewItem)[],
    { defaultPageSize: 20 },
  )

  /* ---------- 多 IP 过滤 ---------- */
  const [filterIps, setFilterIps] = useState<string[]>([])

  /** 从完整列表中提取去重 IP 列表，用于下拉选项 */
  const ipOptions = useMemo(() => {
    const set = new Set<string>()
    list.forEach((item) => {
      if (item.ip) set.add(item.ip)
    })
    return Array.from(set).sort().map((ip) => ({ label: ip, value: ip }))
  }, [list])

  /** 经搜索 + IP 过滤后的最终数据 */
  const filteredData = useMemo(() => {
    if (filterIps.length === 0) return searchFiltered
    const ipSet = new Set(filterIps)
    return searchFiltered.filter((item) => item.ip && ipSet.has(item.ip))
  }, [searchFiltered, filterIps])

  const clearIpFilter = useCallback(() => setFilterIps([]), [])

  const columns: ColumnsType<ViewItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
      align: 'center',
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      width: 120,
      render: (v: string) => v ?? '—',
    },
    {
      title: '地址',
      dataIndex: 'address',
      width: 140,
      render: (v: string) =>
        v ? (
          <Tooltip title={v}>
            <div className="admin-table-cell-ellipsis-2">{v}</div>
          </Tooltip>
        ) : '—',
    },
    {
      title: '浏览器',
      dataIndex: 'agent',
      width: 200,
      render: (v: string) =>
        v ? (
          <Tooltip title={v}>
            <div className="admin-table-cell-ellipsis-2">{v}</div>
          </Tooltip>
        ) : '—',
    },
    {
      title: '用户',
      key: 'username',
      width: 110,
      align: 'center',
      render: (_: unknown, r: ViewItem) =>
        r.user ? (r.user.namec || r.user.username) : <Tag>游客</Tag>,
    },
    {
      title: '文章',
      key: 'articleTitle',
      width: 180,
      render: (_: unknown, r: ViewItem) =>
        r.article?.title ? (
          <Tooltip title={r.article.title}>
            <div className="admin-table-cell-ellipsis-2">{r.article.title}</div>
          </Tooltip>
        ) : '—',
    },
    {
      title: '页面',
      key: 'routePage',
      width: 120,
      align: 'center',
      render: (_: unknown, r: ViewItem) =>
        r.route?.page ? (
          <Tooltip title={r.route.page}>
            <Tag>{r.route.page}</Tag>
          </Tooltip>
        ) : '—',
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 110,
      align: 'center',
      sorter: (a, b) =>
        new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
      render: (v: string) =>
        v ? (
          <Tooltip title={formatDateTime(v)}>{formatDateRelative(v)}</Tooltip>
        ) : '—',
    },
    ...(!isGuest
      ? [
          {
            title: '操作',
            key: 'action',
            width: 80,
            align: 'center' as const,
            fixed: 'right' as const,
            render: (_: unknown, record: ViewItem) => (
              <Popconfirm
                title="确定删除该浏览记录？"
                onConfirm={() => remove.mutate(record.id)}
                okButtonProps={{ loading: remove.isPending }}
              >
                <Button type="link" size="small" danger>
                  删除
                </Button>
              </Popconfirm>
            ),
          },
        ]
      : []),
  ]

  const toolbarRef = useRef<HTMLDivElement>(null)
  const { containerRef, scrollY } = useTableScrollY({ toolbarRef })

  return (
    <div className="admin-content">
      <h1>浏览记录</h1>
      <div className="admin-content__table-wrap">
        <div ref={containerRef} className="admin-content__table-body">
          <div
            ref={toolbarRef}
            className="admin-content__toolbar"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
          >
            <Space wrap>
              <Input.Search
                placeholder="搜索 ID / IP / 地址 / 浏览器"
                allowClear
                onSearch={onSearch}
                style={{ width: 260 }}
                prefix={<SearchOutlined />}
              />
              <Select
                mode="multiple"
                allowClear
                placeholder="按 IP 过滤"
                value={filterIps}
                onChange={setFilterIps}
                options={ipOptions}
                style={{ minWidth: 200, maxWidth: 400 }}
                maxTagCount="responsive"
                suffixIcon={<FilterOutlined />}
                showSearch
                filterOption={(input, option) =>
                  (option?.label as string)?.includes(input) ?? false
                }
              />
              {filterIps.length > 0 && (
                <Button
                  type="link"
                  size="small"
                  icon={<CloseCircleOutlined />}
                  onClick={clearIpFilter}
                >
                  清除 IP 过滤
                </Button>
              )}
            </Space>
            <WriteAction>
              <Button icon={<DownloadOutlined />} onClick={() => exportToJSON(list, 'views')}>
                导出
              </Button>
            </WriteAction>
          </div>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredData}
            loading={isLoading}
            pagination={pagination}
            scroll={{ y: scrollY }}
          />
        </div>
      </div>
    </div>
  )
}
