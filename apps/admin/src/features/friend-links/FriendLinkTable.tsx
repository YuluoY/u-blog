import { Table, Button, Space, Popconfirm, Tag, Tooltip, Avatar } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CheckOutlined, CloseOutlined, LinkOutlined } from '@ant-design/icons'
import { formatDateTime, formatDateRelative } from '../../shared/utils/formatDate'
import type { FriendLinkItem } from './api'

/** 状态颜色 */
const STATUS_MAP: Record<string, { color: string; label: string }> = {
  pending: { color: 'gold', label: '待审核' },
  approved: { color: 'green', label: '已通过' },
  rejected: { color: 'red', label: '已拒绝' },
}

interface FriendLinkTableProps {
  dataSource: FriendLinkItem[]
  loading?: boolean
  onAdd: () => void
  onEdit: (record: FriendLinkItem) => void
  onDelete: (id: number) => void
  onReview: (id: number, status: 'approved' | 'rejected') => void
  deleteLoading?: boolean
  reviewLoading?: boolean
  scrollY?: number
}

export function FriendLinkTable({
  dataSource,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onReview,
  deleteLoading,
  reviewLoading,
  scrollY,
}: FriendLinkTableProps) {
  const columns: ColumnsType<FriendLinkItem> = [
    { title: 'ID', dataIndex: 'id', width: 60, align: 'center' },
    {
      title: '图标',
      dataIndex: 'icon',
      width: 60,
      align: 'center',
      render: (v: string | null) =>
        v ? <Avatar src={v} size="small" /> : <Avatar icon={<LinkOutlined />} size="small" />,
    },
    {
      title: '标题',
      dataIndex: 'title',
      width: 140,
      ellipsis: true,
      render: (v: string, r: FriendLinkItem) => (
        <a href={r.url} target="_blank" rel="noopener noreferrer">
          {v}
        </a>
      ),
    },
    {
      title: 'URL',
      dataIndex: 'url',
      ellipsis: true,
      width: 200,
      render: (v: string) => (
        <Tooltip title={v}>
          <a href={v} target="_blank" rel="noopener noreferrer">{v}</a>
        </Tooltip>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      width: 160,
      ellipsis: true,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 140,
      ellipsis: true,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      align: 'center',
      render: (v: string) => {
        const s = STATUS_MAP[v] || { color: 'default', label: v }
        return <Tag color={s.color}>{s.label}</Tag>
      },
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      width: 70,
      align: 'center',
    },
    {
      title: '创建',
      dataIndex: 'createdAt',
      width: 110,
      align: 'center',
      render: (v: string) =>
        v ? <Tooltip title={formatDateTime(v)}>{formatDateRelative(v)}</Tooltip> : '—',
    },
    {
      title: '操作',
      key: 'action',
      width: 210,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space size={2}>
          {/* 待审核时显示审核按钮 */}
          {record.status === 'pending' && (
            <>
              <Popconfirm
                title="确定通过该友链申请？"
                onConfirm={() => onReview(record.id, 'approved')}
                okButtonProps={{ loading: reviewLoading }}
              >
                <Button type="link" size="small" icon={<CheckOutlined />} style={{ color: '#52c41a' }}>
                  通过
                </Button>
              </Popconfirm>
              <Popconfirm
                title="确定拒绝该友链申请？"
                onConfirm={() => onReview(record.id, 'rejected')}
                okButtonProps={{ loading: reviewLoading }}
              >
                <Button type="link" size="small" icon={<CloseOutlined />} danger>
                  拒绝
                </Button>
              </Popconfirm>
            </>
          )}
          <Button type="link" size="small" onClick={() => onEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该友链？"
            onConfirm={() => onDelete(record.id)}
            okButtonProps={{ loading: deleteLoading }}
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <div className="admin-content__toolbar">
        <Button type="primary" onClick={onAdd}>
          新增
        </Button>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={false}
        scroll={scrollY != null ? { y: scrollY } : undefined}
      />
    </>
  )
}
