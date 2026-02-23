import { Table, Button, Space, Popconfirm, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons'
import { formatDateTime, formatDateRelative } from '../../shared/utils/formatDate'
import type { RouteItem } from './api'

/** 布尔值渲染 */
function BoolTag({ value }: { value: boolean }) {
  return value
    ? <CheckCircleFilled style={{ color: '#52c41a' }} />
    : <CloseCircleFilled style={{ color: '#d9d9d9' }} />
}

interface RouteTableProps {
  dataSource: RouteItem[]
  loading?: boolean
  onAdd: () => void
  onEdit: (record: RouteItem) => void
  onDelete: (id: number) => void
  deleteLoading?: boolean
  scrollY?: number
}

export function RouteTable({
  dataSource,
  loading,
  onAdd,
  onEdit,
  onDelete,
  deleteLoading,
  scrollY,
}: RouteTableProps) {
  const columns: ColumnsType<RouteItem> = [
    { title: 'ID', dataIndex: 'id', width: 50, align: 'center' },
    { title: '标题', dataIndex: 'title', width: 100, render: (v: string | null) => v ?? '—' },
    { title: '名称', dataIndex: 'name', width: 100 },
    { title: '路径', dataIndex: 'path', width: 150, ellipsis: true },
    {
      title: '组件',
      dataIndex: 'component',
      width: 150,
      ellipsis: true,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: '图标',
      dataIndex: 'icon',
      width: 80,
      ellipsis: true,
      render: (v: string | null) => v ?? '—',
    },
    { title: '父 ID', dataIndex: 'pid', width: 60, align: 'center', render: (v: number | null) => v ?? '—' },
    { title: '缓存', dataIndex: 'isKeepAlive', width: 55, align: 'center', render: (v: boolean) => <BoolTag value={v} /> },
    { title: '固定', dataIndex: 'isAffix', width: 55, align: 'center', render: (v: boolean) => <BoolTag value={v} /> },
    { title: '鉴权', dataIndex: 'isProtected', width: 55, align: 'center', render: (v: boolean) => <BoolTag value={v} /> },
    { title: 'Hero', dataIndex: 'isHero', width: 55, align: 'center', render: (v: boolean) => <BoolTag value={v} /> },
    { title: '左栏', dataIndex: 'isLeftSide', width: 55, align: 'center', render: (v: boolean) => <BoolTag value={v} /> },
    { title: '右栏', dataIndex: 'isRightSide', width: 55, align: 'center', render: (v: boolean) => <BoolTag value={v} /> },
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
            title="确定删除该路由？"
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
        scroll={scrollY != null ? { x: 1400, y: scrollY } : { x: 1400 }}
      />
    </>
  )
}
