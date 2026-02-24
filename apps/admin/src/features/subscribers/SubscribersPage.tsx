import { Table, Button, Popconfirm, Tooltip, Input, Tag } from 'antd'
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import { useTableFilter } from '../../shared/hooks/useTableFilter'
import { formatDateTime, formatDateRelative } from '../../shared/utils/formatDate'
import { exportToJSON } from '../../shared/utils/exportData'
import { WriteAction } from '../../shared/components/WriteAction'
import { useGuestMode } from '../../contexts/GuestModeContext'
import { useSubscribers } from './useSubscribers'
import { useSubscriberMutations } from './useSubscriberMutations'
import type { SubscriberItem } from './api'

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  active: { color: 'green', label: '已订阅' },
  pending: { color: 'orange', label: '待验证' },
  unsubscribed: { color: 'default', label: '已退订' },
}

/** 订阅管理页面（只读 + 删除） */
export default function SubscribersPage() {
  const { data: list = [], isLoading } = useSubscribers()
  const { remove } = useSubscriberMutations()
  const { isGuest } = useGuestMode()
  const { filteredData, onSearch, pagination } = useTableFilter(
    list,
    ['id', 'email', 'name'] as (keyof SubscriberItem)[],
    { defaultPageSize: 20 },
  )

  const columns: ColumnsType<SubscriberItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
      align: 'center',
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 220,
      render: (v: string) => v || '—',
    },
    {
      title: '昵称',
      dataIndex: 'name',
      width: 120,
      render: (v: string | null) => v || '—',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      align: 'center',
      filters: [
        { text: '已订阅', value: 'active' },
        { text: '待验证', value: 'pending' },
        { text: '已退订', value: 'unsubscribed' },
      ],
      onFilter: (value, r) => r.status === value,
      render: (v: string) => {
        const cfg = STATUS_MAP[v] || { color: 'default', label: v }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '订阅时间',
      dataIndex: 'createdAt',
      width: 130,
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
            render: (_: unknown, record: SubscriberItem) => (
              <Popconfirm
                title="确定删除该订阅记录？"
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

  const { containerRef, scrollY } = useTableScrollY()

  return (
    <div className="admin-content">
      <h1>订阅管理</h1>
      <div className="admin-content__table-wrap">
        <div ref={containerRef} className="admin-content__table-body">
          <div
            className="admin-content__toolbar"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Input.Search
              placeholder="搜索 ID / 邮箱 / 昵称"
              allowClear
              onSearch={onSearch}
              style={{ width: 260 }}
              prefix={<SearchOutlined />}
            />
            <WriteAction>
              <Button icon={<DownloadOutlined />} onClick={() => exportToJSON(list, 'subscribers')}>
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
