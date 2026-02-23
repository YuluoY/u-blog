import { Table, Button, Space, Popconfirm, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime, formatDateRelative } from '../../shared/utils/formatDate'
import type { RoleItem } from './api'

interface RoleTableProps {
  dataSource: RoleItem[]
  loading?: boolean
  onAdd: () => void
  onEdit: (record: RoleItem) => void
  onDelete: (id: number) => void
  deleteLoading?: boolean
  scrollY?: number
}

export function RoleTable({
  dataSource,
  loading,
  onAdd,
  onEdit,
  onDelete,
  deleteLoading,
  scrollY,
}: RoleTableProps) {
  const columns: ColumnsType<RoleItem> = [
    { title: 'ID', dataIndex: 'id', width: 60, align: 'center' },
    { title: '角色名称', dataIndex: 'name', width: 120 },
    {
      title: '描述',
      dataIndex: 'desc',
      width: 200,
      ellipsis: true,
      render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip>,
    },
    {
      title: '权限数',
      dataIndex: 'permissions',
      width: 90,
      align: 'center',
      render: (perms: unknown[] | undefined) => (
        <Tag color="blue">{perms?.length ?? 0}</Tag>
      ),
    },
    {
      title: '关联权限',
      dataIndex: 'permissions',
      width: 300,
      ellipsis: true,
      render: (perms: { id: number; name: string }[] | undefined) =>
        perms && perms.length > 0
          ? perms.slice(0, 5).map((p) => <Tag key={p.id}>{p.name}</Tag>)
          : '—',
    },
    {
      title: '创建',
      dataIndex: 'createdAt',
      width: 110,
      align: 'center',
      render: (v: string) => v ? <Tooltip title={formatDateTime(v)}>{formatDateRelative(v)}</Tooltip> : '—',
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
            title="确定删除该角色？"
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
