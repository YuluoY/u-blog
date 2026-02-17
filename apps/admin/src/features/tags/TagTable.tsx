import { Table, Button, Space, Popconfirm, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime, formatDateRelative } from '../../shared/utils/formatDate'
import type { TagItem } from './api'

interface TagTableProps {
  dataSource: TagItem[]
  loading?: boolean
  onAdd: () => void
  onEdit: (record: TagItem) => void
  onDelete: (id: number) => void
  deleteLoading?: boolean
  scrollY?: number
}

export function TagTable({
  dataSource,
  loading,
  onAdd,
  onEdit,
  onDelete,
  deleteLoading,
  scrollY,
}: TagTableProps) {
  const columns: ColumnsType<TagItem> = [
    { title: 'ID', dataIndex: 'id', width: 70, align: 'center' },
    { title: '名称', dataIndex: 'name', width: 120,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    {
      title: '颜色',
      dataIndex: 'color',
      width: 80,
      align: 'center',
      render: (color: string | null) =>
        color ? (
          <span
            style={{
              display: 'inline-block',
              width: 32,
              height: 20,
              borderRadius: 4,
              background: color,
            }}
          />
        ) : (
          '—'
        ),
    },
    { title: '描述', dataIndex: 'desc', width: 160,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    { title: '用户ID', dataIndex: 'userId', width: 80, align: 'center' },
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
            title="确定删除该标签？"
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
