import { useRef } from 'react'
import { Table, Button, Popconfirm, Tooltip, Input, Tag } from 'antd'
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons'
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

/** 浏览记录管理页面（只读 + 删除） */
export default function ViewsPage() {
  const { data: list = [], isLoading } = useViews()
  const { remove } = useViewMutations()
  const { isGuest } = useGuestMode()
  const { filteredData, onSearch, pagination } = useTableFilter(
    list,
    ['id', 'ip', 'address', 'agent'] as (keyof ViewItem)[],
    { defaultPageSize: 20 },
  )

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
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Input.Search
              placeholder="搜索 ID / IP / 地址 / 浏览器"
              allowClear
              onSearch={onSearch}
              style={{ width: 260 }}
              prefix={<SearchOutlined />}
            />
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
