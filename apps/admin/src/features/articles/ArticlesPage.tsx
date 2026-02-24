import { useState } from 'react'
import { Table, Button, Popconfirm, Switch, Tooltip, Space, Dropdown, App, Input } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import { useTableFilter } from '../../shared/hooks/useTableFilter'
import { formatDateTime, formatDateRelative } from '../../shared/utils/formatDate'
import { useArticles } from './useArticles'
import { useArticleMutations } from './useArticleMutations'
import { useCategories } from '../categories/useCategories'
import { ArticleEditorDrawer } from './ArticleEditorDrawer'
import { exportArticles } from './api'
import type { ArticleItem } from './api'
import type { ArticleFormValues } from './ArticleEditorDrawer'
import { WriteAction } from '../../shared/components/WriteAction'
import { useGuestMode } from '../../contexts/GuestModeContext'

const STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '已发布' },
  { value: 'deleted', label: '已删除' },
]

export default function ArticlesPage() {
  const { data: list = [], isLoading } = useArticles()
  const { data: categories = [] } = useCategories()
  const { update, remove } = useArticleMutations()
  const { isGuest } = useGuestMode()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<ArticleItem | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [exporting, setExporting] = useState(false)
  const { message } = App.useApp()

  // 搜索 + 分页
  const searchFields: ((item: ArticleItem) => string)[] = [
    (r) => String(r.id),
    (r) => r.title ?? '',
    (r) => r.desc ?? '',
    (r) => r.status ?? '',
  ]
  const { filteredData, onSearch, pagination } = useTableFilter(list, searchFields)

  const handleEdit = (record: ArticleItem) => {
    setEditing(record)
    setDrawerOpen(true)
  }

  const handleSubmit = async (values: ArticleFormValues) => {
    if (!editing) return
    await update.mutateAsync({
      id: editing.id,
      title: values.title,
      desc: values.desc,
      content: values.content,
      cover: values.cover,
      status: values.status,
      isPrivate: values.isPrivate,
      isTop: values.isTop,
      categoryId: values.categoryId ?? null,
      publishedAt: values.publishedAt,
    })
    setDrawerOpen(false)
    setEditing(null)
  }

  const columns: ColumnsType<ArticleItem> = [
    { title: 'ID', dataIndex: 'id', width: 68, align: 'center', sorter: (a, b) => a.id - b.id },
    { title: '标题', dataIndex: 'title', width: 200,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    {
      title: '状态',
      dataIndex: 'status',
      width: 88,
      align: 'center',
      filters: STATUS_OPTIONS.map((o) => ({ text: o.label, value: o.value })),
      onFilter: (value, record) => record.status === value,
      render: (s: string) => STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s,
    },
    { title: '分类ID', dataIndex: 'categoryId', width: 80, align: 'center', sorter: (a, b) => (a.categoryId ?? 0) - (b.categoryId ?? 0) },
    {
      title: '置顶',
      dataIndex: 'isTop',
      width: 68,
      align: 'center',
      render: (v: boolean, record: ArticleItem) => (
        <Switch
          size="small"
          checked={v}
          disabled={isGuest}
          onChange={(checked) => update.mutate({ id: record.id, isTop: checked })}
        />
      ),
    },
    {
      title: '私密',
      dataIndex: 'isPrivate',
      width: 68,
      align: 'center',
      render: (v: boolean, record: ArticleItem) => (
        <Switch
          size="small"
          checked={v}
          disabled={isGuest}
          onChange={(checked) => update.mutate({ id: record.id, isPrivate: checked })}
        />
      ),
    },
    {
      title: '发布时间',
      dataIndex: 'publishedAt',
      width: 110,
      align: 'center',
      sorter: (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime(),
      render: (v: string) => (
        <Tooltip title={formatDateTime(v)}>{formatDateRelative(v)}</Tooltip>
      ),
    },
    { title: '创建', dataIndex: 'createdAt', width: 110, align: 'center', sorter: (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(), render: (v: string) => <Tooltip title={formatDateTime(v)}>{formatDateRelative(v)}</Tooltip> },
    { title: '更新', dataIndex: 'updatedAt', width: 110, align: 'center', sorter: (a, b) => new Date(a.updatedAt ?? 0).getTime() - new Date(b.updatedAt ?? 0).getTime(), render: (v: string) => <Tooltip title={formatDateTime(v)}>{formatDateRelative(v)}</Tooltip> },
    { title: '用户ID', dataIndex: 'userId', width: 78, align: 'center' },
    { title: '评论数', dataIndex: 'commentCount', width: 78, align: 'center', sorter: (a, b) => (a.commentCount ?? 0) - (b.commentCount ?? 0) },
    { title: '点赞数', dataIndex: 'likeCount', width: 78, align: 'center', sorter: (a, b) => (a.likeCount ?? 0) - (b.likeCount ?? 0) },
    { title: '阅读量', dataIndex: 'viewCount', width: 78, align: 'center', sorter: (a, b) => (a.viewCount ?? 0) - (b.viewCount ?? 0) },
    { title: '描述', dataIndex: 'desc', width: 140,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    { title: '封面', dataIndex: 'cover', width: 100,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    ...(!isGuest ? [{
      title: '操作',
      key: 'action',
      width: 240,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_: unknown, record: ArticleItem) => (
        <>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Dropdown
            menu={{
              items: downloadMenuItems,
              onClick: ({ key }) => handleDownload([record.id], key as 'md' | 'html' | 'word'),
            }}
          >
            <Button type="link" size="small" icon={<DownloadOutlined />}>
              下载
            </Button>
          </Dropdown>
          <Popconfirm
            title="确定删除该文章？"
            onConfirm={() => remove.mutate(record.id)}
            okButtonProps={{ loading: remove.isPending }}
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </>
      ),
    }] : []),
  ]

  const { containerRef, scrollY } = useTableScrollY()

  /** 下载文章 */
  const handleDownload = async (ids: number[], format: 'md' | 'html' | 'word') => {
    if (ids.length === 0) { message.warning('请先选择文章'); return }
    setExporting(true)
    try {
      // word 格式用 html 数据源，通过 mso 头使 Word 可直接打开
      const apiFormat = format === 'word' ? 'html' : format
      const articles = await exportArticles(ids, apiFormat)
      if (!articles || articles.length === 0) { message.warning('未导出任何文章'); return }

      const { default: JSZip } = await import('jszip')
      const { saveAs } = await import('file-saver')

      /** 为 Word 格式包装 mso 头 */
      const wrapForWord = (html: string) =>
        `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">` +
        `<head><meta charset="utf-8"><style>body{font-family:'Microsoft YaHei',sans-serif;line-height:1.8}pre{background:#f6f8fa;padding:16px}img{max-width:100%}</style></head>` +
        `<body>${html}</body></html>`

      const ext = format === 'md' ? '.md' : format === 'word' ? '.doc' : '.html'
      const mime = format === 'md' ? 'text/markdown;charset=utf-8'
        : format === 'word' ? 'application/msword;charset=utf-8'
        : 'text/html;charset=utf-8'

      if (articles.length === 1) {
        const a = articles[0]
        const content = format === 'word' ? wrapForWord(a.content) : a.content
        saveAs(new Blob([content], { type: mime }), `${a.title}${ext}`)
      } else {
        const zip = new JSZip()
        for (const a of articles) {
          const content = format === 'word' ? wrapForWord(a.content) : a.content
          zip.file(`${a.title}${ext}`, content)
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' })
        saveAs(zipBlob, `articles-${format}-${Date.now()}.zip`)
      }

      message.success(`已导出 ${articles.length} 篇文章`)
    } catch (e: any) {
      message.error(e.message || '导出失败')
    } finally {
      setExporting(false)
    }
  }

  /** 下载菜单项 */
  const downloadMenuItems = [
    { key: 'md', label: 'Markdown (.md)' },
    { key: 'html', label: 'HTML (.html)' },
    { key: 'word', label: 'Word (.docx)' },
  ]

  return (
    <div className="admin-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>文章管理</h1>
        <Space>
          <Input.Search
            placeholder="搜索 ID / 标题 / 描述 / 状态"
            allowClear
            onSearch={onSearch}
            style={{ width: 260 }}
            prefix={<SearchOutlined />}
          />
          <WriteAction>
            <Space>
            {selectedIds.length > 0 && (
              <span style={{ color: '#888', fontSize: 13 }}>已选 {selectedIds.length} 篇</span>
            )}
            <Dropdown
              menu={{
                items: downloadMenuItems,
                onClick: ({ key }) => handleDownload(selectedIds, key as 'md' | 'html' | 'word'),
              }}
              disabled={selectedIds.length === 0 || exporting}
            >
              <Button icon={<DownloadOutlined />} loading={exporting}>
                批量下载
              </Button>
            </Dropdown>
          </Space>
        </WriteAction>
        </Space>
      </div>
      <div className="admin-content__table-wrap">
        <div ref={containerRef} className="admin-content__table-body">
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredData}
            loading={isLoading}
            pagination={pagination}
            scroll={{ y: scrollY }}
            rowSelection={isGuest ? undefined : {
              selectedRowKeys: selectedIds,
              onChange: (keys) => setSelectedIds(keys as number[]),
            }}
          />
        </div>
      </div>
      <ArticleEditorDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
        onSubmit={handleSubmit}
        loading={update.isPending}
        article={editing}
        categories={categories}
      />
    </div>
  )
}
