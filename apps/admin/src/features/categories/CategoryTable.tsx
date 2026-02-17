import { Table, Button, Space, Popconfirm, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime, formatDateRelative } from '../../shared/utils/formatDate'
import type { CategoryItem } from './api'

interface CategoryTableProps {
  dataSource: CategoryItem[]
  loading?: boolean
  onAdd: () => void
  onEdit: (record: CategoryItem) => void
  onDelete: (id: number) => void
  deleteLoading?: boolean
  scrollY?: number
}

export function CategoryTable({
  dataSource,
  loading,
  onAdd,
  onEdit,
  onDelete,
  deleteLoading,
  scrollY,
}: CategoryTableProps) {
  const columns: ColumnsType<CategoryItem> = [
    { title: 'ID', dataIndex: 'id', width: 70, align: 'center' },
    { title: '名称', dataIndex: 'name', width: 140,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    { title: '描述', dataIndex: 'desc', width: 180,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
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
            title="确定删除该分类？"
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
