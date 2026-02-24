import { Table, Button, Space, Popconfirm, Tag, Tooltip, Input } from 'antd'
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime, formatDateRelative } from '../../shared/utils/formatDate'
import { exportToJSON } from '../../shared/utils/exportData'
import { useTableFilter } from '../../shared/hooks/useTableFilter'
import { WriteAction } from '../../shared/components/WriteAction'
import { useGuestMode } from '../../contexts/GuestModeContext'
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
  const { isGuest } = useGuestMode()
  const { filteredData, onSearch, pagination } = useTableFilter(
    dataSource, ['id', 'name', 'code', 'desc', 'resource'] as (keyof PermissionItem)[], { defaultPageSize: 20 },
  )

  const columns: ColumnsType<PermissionItem> = [
    { title: 'ID', dataIndex: 'id', width: 60, align: 'center', sorter: (a, b) => a.id - b.id },
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
      filters: [
        { text: 'menu', value: 'menu' },
        { text: 'api', value: 'api' },
        { text: 'button', value: 'button' },
        { text: 'page', value: 'page' },
      ],
      onFilter: (value, record) => record.type === value,
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
      filters: [
        { text: 'create', value: 'create' },
        { text: 'read', value: 'read' },
        { text: 'update', value: 'update' },
        { text: 'delete', value: 'delete' },
        { text: 'manage', value: 'manage' },
      ],
      onFilter: (value, record) => record.action === value,
      render: (v: string) => <Tag color={ACTION_COLOR[v] || 'default'}>{v}</Tag>,
    },
    {
      title: '创建',
      dataIndex: 'createdAt',
      width: 110,
      align: 'center',
      sorter: (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
      render: (v: string) => v ? <Tooltip title={formatDateTime(v)}>{formatDateRelative(v)}</Tooltip> : '—',
    },
    ...(!isGuest ? [{
      title: '操作',
      key: 'action_col',
      width: 160,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_: unknown, record: PermissionItem) => (
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
    }] : []),
  ]

  return (
    <>
      <div className="admin-content__toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Input.Search placeholder="搜索 ID / 名称 / 编码 / 描述 / 资源" allowClear onSearch={onSearch} style={{ width: 260 }} prefix={<SearchOutlined />} />
        <WriteAction>
          <Space>
            <Button type="primary" onClick={onAdd}>新增</Button>
            <Button icon={<DownloadOutlined />} onClick={() => exportToJSON(dataSource, 'permissions')}>导出</Button>
          </Space>
        </WriteAction>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={pagination}
        scroll={scrollY != null ? { y: scrollY } : undefined}
      />
    </>
  )
}
