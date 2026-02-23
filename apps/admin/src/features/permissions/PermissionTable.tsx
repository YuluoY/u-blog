import { Table, Button, Space, Popconfirm, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime, formatDateRelative } from '../../shared/utils/formatDate'
import type { PermissionItem } from './api'

/** 权限类型颜色映射 */
const TYPE_COLOR: Record<string, string> = {
  menu: 'blue',
  api: 'green',
  button: 'orange',
  page: 'purple',
}

/** 操作类型颜色 */
const ACTION_COLOR: Record<string, string> = {
  create: 'green',
  read: 'blue',
  update: 'orange',
  delete: 'red',
  manage: 'purple',
}

interface PermissionTableProps {
  dataSource: PermissionItem[]
  loading?: boolean
  onAdd: () => void
  onEdit: (record: PermissionItem) => void
  onDelete: (id: number) => void
  deleteLoading?: boolean
  scrollY?: number
}

export function PermissionTable({
  dataSource,
  loading,
  onAdd,
  onEdit,
  onDelete,
  deleteLoading,
  scrollY,
}: PermissionTableProps) {
  const columns: ColumnsType<PermissionItem> = [
    { title: 'ID', dataIndex: 'id', width: 60, align: 'center' },
    { title: '名称', dataIndex: 'name', width: 140 },
    { title: '编码', dataIndex: 'code', width: 160, ellipsis: true },
    {
      title: '描述',
      dataIndex: 'desc',
      width: 180,
      ellipsis: true,
      render: (v: string | null) => <Tooltip title={v}><span>{v ?? '—'}</span></Tooltip>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 80,
      align: 'center',
      render: (v: string) => <Tag color={TYPE_COLOR[v] || 'default'}>{v}</Tag>,
    },
    {
      title: '资源',
      dataIndex: 'resource',
      width: 120,
      ellipsis: true,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      width: 90,
      align: 'center',
      render: (v: string) => <Tag color={ACTION_COLOR[v] || 'default'}>{v}</Tag>,
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
      key: 'action_col',
      width: 160,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => onEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该权限？"
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
