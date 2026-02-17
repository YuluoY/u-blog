import { Table, Button, Popconfirm, Image, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import { formatDateTime, formatDateRelative } from '../../shared/utils/formatDate'
import { useMedia } from './useMedia'
import { useMediaMutations } from './useMediaMutations'
import type { MediaItem } from './api'

function formatSize(s: number | null | undefined): string {
  if (s == null) return '—'
  if (s < 1024) return `${s} B`
  if (s < 1024 * 1024) return `${(s / 1024).toFixed(1)} KB`
  return `${(s / (1024 * 1024)).toFixed(1)} MB`
}

export default function MediaPage() {
  const { data: list = [], isLoading } = useMedia()
  const { remove } = useMediaMutations()

  const columns: ColumnsType<MediaItem> = [
    { title: 'ID', dataIndex: 'id', width: 70, align: 'center' },
    { title: '名称', dataIndex: 'name', width: 160,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    {
      title: '预览',
      dataIndex: 'url',
      width: 72,
      align: 'center',
      render: (url: string, row: MediaItem) => {
        const t = (row.type ?? '').toLowerCase()
        const ext = (row.ext ?? '').toLowerCase()
        if (t.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
          return <Image src={url} width={48} height={48} style={{ objectFit: 'cover' }} />
        }
        return <span style={{ color: '#999' }}>—</span>
      },
    },
    { title: '类型', dataIndex: 'type', width: 88, align: 'center' },
    { title: '大小', dataIndex: 'size', width: 88, align: 'center', render: formatSize },
    { title: '地址', dataIndex: 'url', width: 180,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    { title: '扩展名', dataIndex: 'ext', width: 78, align: 'center' },
    { title: '原始名', dataIndex: 'originalName', width: 120,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    { title: '缩略图', dataIndex: 'thumbnail', width: 100,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    {
      title: '创建',
      dataIndex: 'createdAt',
      width: 110,
      align: 'center',
      render: (v: string) => (v ? <Tooltip title={formatDateTime(v)}>{formatDateRelative(v)}</Tooltip> : '—'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Popconfirm
          title="确定删除该媒体？"
          onConfirm={() => remove.mutate(record.id)}
          okButtonProps={{ loading: remove.isPending }}
        >
          <Button type="link" size="small" danger>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ]

  const { containerRef, scrollY } = useTableScrollY()

  return (
    <div className="admin-content">
      <h1>媒体库</h1>
      <div className="admin-content__table-wrap">
        <div ref={containerRef} className="admin-content__table-body">
          <Table
            rowKey="id"
            columns={columns}
            dataSource={list}
            loading={isLoading}
            pagination={{ pageSize: 20 }}
            scroll={{ y: scrollY }}
          />
        </div>
      </div>
    </div>
  )
}
