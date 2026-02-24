import { Table, Button, Space, Popconfirm, Tooltip, Input } from 'antd'
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime, formatDateRelative } from '../../shared/utils/formatDate'
import { exportToJSON } from '../../shared/utils/exportData'
import { useTableFilter } from '../../shared/hooks/useTableFilter'
import { WriteAction } from '../../shared/components/WriteAction'
import { useGuestMode } from '../../contexts/GuestModeContext'
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
  const { isGuest } = useGuestMode()
  const { filteredData, onSearch, pagination } = useTableFilter(
    dataSource, ['id', 'name', 'desc'] as (keyof CategoryItem)[], { defaultPageSize: 20 },
  )

  const columns: ColumnsType<CategoryItem> = [
    { title: 'ID', dataIndex: 'id', width: 70, align: 'center', sorter: (a, b) => a.id - b.id },
    { title: '名称', dataIndex: 'name', width: 140,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    { title: '描述', dataIndex: 'desc', width: 180,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    { title: '用户ID', dataIndex: 'userId', width: 80, align: 'center' },
    {
      title: '创建',
      dataIndex: 'createdAt',
      width: 110,
      align: 'center',
      sorter: (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
      render: (v: string) => (v ? <Tooltip title={formatDateTime(v)}>{formatDateRelative(v)}</Tooltip> : '—'),
    },
    {
      title: '更新',
      dataIndex: 'updatedAt',
      width: 110,
      align: 'center',
      sorter: (a, b) => new Date(a.updatedAt ?? 0).getTime() - new Date(b.updatedAt ?? 0).getTime(),
      render: (v: string) => (v ? <Tooltip title={formatDateTime(v)}>{formatDateRelative(v)}</Tooltip> : '—'),
    },
    ...(!isGuest ? [{
      title: '操作',
      key: 'action',
      width: 160,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_: unknown, record: CategoryItem) => (
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
    }] : []),
  ]

  return (
    <>
      <div className="admin-content__toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Input.Search placeholder="搜索 ID / 名称 / 描述" allowClear onSearch={onSearch} style={{ width: 220 }} prefix={<SearchOutlined />} />
        <WriteAction>
          <Space>
            <Button type="primary" onClick={onAdd}>新增</Button>
            <Button icon={<DownloadOutlined />} onClick={() => exportToJSON(dataSource, 'categories')}>导出</Button>
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
