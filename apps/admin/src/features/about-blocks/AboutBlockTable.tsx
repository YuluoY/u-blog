import { Table, Button, Space, Popconfirm, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime, formatDateRelative } from '../../shared/utils/formatDate'
import type { AboutBlockItem } from './api'

interface AboutBlockTableProps {
  dataSource: AboutBlockItem[]
  loading?: boolean
  onAdd: () => void
  onEdit: (record: AboutBlockItem) => void
  onDelete: (id: number) => void
  deleteLoading?: boolean
  scrollY?: number
}

export function AboutBlockTable({
  dataSource,
  loading,
  onAdd,
  onEdit,
  onDelete,
  deleteLoading,
  scrollY,
}: AboutBlockTableProps) {
  const columns: ColumnsType<AboutBlockItem> = [
    { title: 'ID', dataIndex: 'id', width: 68, align: 'center' },
    { title: '页面', dataIndex: 'page', width: 88, align: 'center' },
    { title: '类型', dataIndex: 'type', width: 96, align: 'center' },
    { title: '标题', dataIndex: 'title', width: 140,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    {
      title: '内容',
      dataIndex: 'content',
      width: 200,
      render: (t: string) => <Tooltip title={t}><div className="admin-table-cell-ellipsis-2">{t ?? '—'}</div></Tooltip>,
    },
    { title: '排序', dataIndex: 'sortOrder', width: 68, align: 'center' },
    {
      title: 'extra',
      dataIndex: 'extra',
      width: 88,
      align: 'center',
      render: (v: Record<string, unknown> | null) => (v != null ? JSON.stringify(v).slice(0, 20) + '…' : '—'),
    },
    {
      title: '创建',
      dataIndex: 'createdAt',
      width: 110,
      align: 'center',
      render: (v: string) => (v ? <Tooltip title={formatDateTime(v)}>{formatDateRelative(v)}</Tooltip> : '—'),
    },
    {
      title: '更新',
      dataIndex: 'updatedAt',
      width: 110,
      align: 'center',
      render: (v: string) => (v ? <Tooltip title={formatDateTime(v)}>{formatDateRelative(v)}</Tooltip> : '—'),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => onEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该区块？"
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
