import { Table, Button, Space, Popconfirm, Tag, Tooltip, Input } from 'antd'
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime, formatDateRelative } from '../../shared/utils/formatDate'
import { exportToJSON } from '../../shared/utils/exportData'
import { useTableFilter } from '../../shared/hooks/useTableFilter'
import { WriteAction } from '../../shared/components/WriteAction'
import { useGuestMode } from '../../contexts/GuestModeContext'
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
  const { isGuest } = useGuestMode()
  const { filteredData, onSearch, pagination } = useTableFilter(
    dataSource, ['id', 'name', 'desc'] as (keyof RoleItem)[], { defaultPageSize: 20 },
  )

  const columns: ColumnsType<RoleItem> = [
    { title: 'ID', dataIndex: 'id', width: 60, align: 'center', sorter: (a, b) => a.id - b.id },
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
      sorter: (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
      render: (v: string) => v ? <Tooltip title={formatDateTime(v)}>{formatDateRelative(v)}</Tooltip> : '—',
    },
    ...(!isGuest ? [{
      title: '操作',
      key: 'action',
      width: 160,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_: unknown, record: RoleItem) => (
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
    }] : []),
  ]

  return (
    <>
      <div className="admin-content__toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Input.Search placeholder="搜索 ID / 名称 / 描述" allowClear onSearch={onSearch} style={{ width: 220 }} prefix={<SearchOutlined />} />
        <WriteAction>
          <Space>
            <Button type="primary" onClick={onAdd}>新增</Button>
            <Button icon={<DownloadOutlined />} onClick={() => exportToJSON(dataSource, 'roles')}>导出</Button>
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
