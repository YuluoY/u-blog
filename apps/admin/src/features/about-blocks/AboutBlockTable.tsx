import { Table, Button, Space, Popconfirm, Tooltip, Typography, Modal, Input, theme } from 'antd'
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { formatDateTime, formatDateRelative } from '../../shared/utils/formatDate'
import { exportToJSON } from '../../shared/utils/exportData'
import { useTableFilter } from '../../shared/hooks/useTableFilter'
import { WriteAction } from '../../shared/components/WriteAction'
import { useGuestMode } from '../../contexts/GuestModeContext'
import type { AboutBlockItem } from './api'

const { Paragraph } = Typography

/** 内容预览弹窗 — 使用 Ant Design token 适配暗色/亮色主题 */
function ContentPreviewModal({ content, title, open, onClose }: { content: string; title: string; open: boolean; onClose: () => void }) {
  const { token } = theme.useToken()
  return (
    <Modal title={title} open={open} onCancel={onClose} footer={null} width={720}>
      <pre style={{ maxHeight: 500, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: token.colorFillAlter, color: token.colorText, padding: 16, borderRadius: 8, fontSize: 13, lineHeight: 1.6 }}>
        {content}
      </pre>
    </Modal>
  )
}

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
  const [previewContent, setPreviewContent] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const { isGuest } = useGuestMode()
  const { filteredData, onSearch, pagination } = useTableFilter(
    dataSource, ['id', 'page', 'type', 'title'] as (keyof AboutBlockItem)[], { defaultPageSize: 20 },
  )

  const showPreview = (content: string, title: string) => {
    setPreviewContent(content)
    setPreviewTitle(title)
    setPreviewOpen(true)
  }

  const columns: ColumnsType<AboutBlockItem> = [
    { title: 'ID', dataIndex: 'id', width: 68, align: 'center', sorter: (a, b) => a.id - b.id },
    { title: '页面', dataIndex: 'page', width: 88, align: 'center' },
    { title: '类型', dataIndex: 'type', width: 96, align: 'center' },
    { title: '标题', dataIndex: 'title', width: 140,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    {
      title: '内容',
      dataIndex: 'content',
      width: 240,
      render: (text: string, record) => (
        <Paragraph
          ellipsis={{ rows: 2, expandable: false }}
          style={{ margin: 0, cursor: 'pointer', fontSize: 13 }}
          onClick={() => showPreview(text, `内容预览 - ${record.title || record.type}`)}
          title="点击查看完整内容"
        >
          {text ?? '—'}
        </Paragraph>
      ),
    },
    { title: '排序', dataIndex: 'sortOrder', width: 68, align: 'center', sorter: (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) },
    {
      title: 'extra',
      dataIndex: 'extra',
      width: 120,
      render: (v: Record<string, unknown> | null) => {
        if (v == null) return '—'
        const json = JSON.stringify(v, null, 2)
        return (
          <Paragraph
            ellipsis={{ rows: 1, expandable: false }}
            style={{ margin: 0, cursor: 'pointer', fontSize: 12, fontFamily: 'monospace' }}
            onClick={() => showPreview(json, 'extra 数据')}
            title="点击查看完整 JSON"
          >
            {JSON.stringify(v)}
          </Paragraph>
        )
      },
    },
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
      render: (_: unknown, record: AboutBlockItem) => (
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
    }] : []),
  ]

  return (
    <>
      <div className="admin-content__toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Input.Search placeholder="搜索 ID / 页面 / 类型 / 标题" allowClear onSearch={onSearch} style={{ width: 240 }} prefix={<SearchOutlined />} />
        <WriteAction>
          <Space>
            <Button type="primary" onClick={onAdd}>新增</Button>
            <Button icon={<DownloadOutlined />} onClick={() => exportToJSON(dataSource, 'about-blocks')}>导出</Button>
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
      <ContentPreviewModal
        content={previewContent}
        title={previewTitle}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  )
}
