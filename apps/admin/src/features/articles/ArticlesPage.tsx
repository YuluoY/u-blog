import { useState } from 'react'
import { Table, Button, Popconfirm, Switch, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import { formatDateTime, formatDateRelative } from '../../shared/utils/formatDate'
import { useArticles } from './useArticles'
import { useArticleMutations } from './useArticleMutations'
import { useCategories } from '../categories/useCategories'
import { ArticleEditorDrawer } from './ArticleEditorDrawer'
import type { ArticleItem } from './api'
import type { ArticleFormValues } from './ArticleEditorDrawer'

const STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '已发布' },
  { value: 'deleted', label: '已删除' },
]

export default function ArticlesPage() {
  const { data: list = [], isLoading } = useArticles()
  const { data: categories = [] } = useCategories()
  const { update, remove } = useArticleMutations()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<ArticleItem | null>(null)

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
    { title: 'ID', dataIndex: 'id', width: 68, align: 'center' },
    { title: '标题', dataIndex: 'title', width: 200,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    {
      title: '状态',
      dataIndex: 'status',
      width: 88,
      align: 'center',
      render: (s: string) => STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s,
    },
    { title: '分类ID', dataIndex: 'categoryId', width: 80, align: 'center' },
    {
      title: '置顶',
      dataIndex: 'isTop',
      width: 68,
      align: 'center',
      render: (v: boolean, record: ArticleItem) => (
        <Switch
          size="small"
          checked={v}
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
          onChange={(checked) => update.mutate({ id: record.id, isPrivate: checked })}
        />
      ),
    },
    {
      title: '发布时间',
      dataIndex: 'publishedAt',
      width: 110,
      align: 'center',
      render: (v: string) => (
        <Tooltip title={formatDateTime(v)}>{formatDateRelative(v)}</Tooltip>
      ),
    },
    { title: '创建', dataIndex: 'createdAt', width: 110, align: 'center', render: (v: string) => <Tooltip title={formatDateTime(v)}>{formatDateRelative(v)}</Tooltip> },
    { title: '更新', dataIndex: 'updatedAt', width: 110, align: 'center', render: (v: string) => <Tooltip title={formatDateTime(v)}>{formatDateRelative(v)}</Tooltip> },
    { title: '用户ID', dataIndex: 'userId', width: 78, align: 'center' },
    { title: '评论数', dataIndex: 'commentCount', width: 78, align: 'center' },
    { title: '点赞数', dataIndex: 'likeCount', width: 78, align: 'center' },
    { title: '阅读量', dataIndex: 'viewCount', width: 78, align: 'center' },
    { title: '描述', dataIndex: 'desc', width: 140,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    { title: '封面', dataIndex: 'cover', width: 100,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    {
      title: '操作',
      key: 'action',
      width: 140,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
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
    },
  ]

  const { containerRef, scrollY } = useTableScrollY()

  return (
    <div className="admin-content">
      <h1>文章管理</h1>
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
