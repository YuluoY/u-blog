import { Table, Button, Popconfirm, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import { formatDateTime, formatDateRelative } from '../../shared/utils/formatDate'
import { useComments } from './useComments'
import { useCommentMutations } from './useCommentMutations'
import type { CommentItem } from './api'

export default function CommentsPage() {
  const { data: list = [], isLoading } = useComments()
  const { remove } = useCommentMutations()

  const columns: ColumnsType<CommentItem> = [
    { title: 'ID', dataIndex: 'id', width: 70, align: 'center' },
    { title: '内容', dataIndex: 'content', width: 220, render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    { title: '路径', dataIndex: 'path', width: 140, render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    {
      title: '用户名',
      key: 'username',
      width: 110,
      align: 'center',
      render: (_: unknown, r: CommentItem) => (r.user ? (r.user.namec || r.user.username) : '—'),
    },
    {
      title: '文章名',
      key: 'articleTitle',
      width: 160,
      align: 'center',
      render: (_: unknown, r: CommentItem) => (r.article?.title ? <Tooltip title={r.article.title}><div className="admin-table-cell-ellipsis-2">{r.article.title}</div></Tooltip> : '—'),
    },
    {
      title: '父评论用户名',
      key: 'parentUsername',
      width: 110,
      align: 'center',
      render: (_: unknown, r: CommentItem) => (r.parent?.user ? (r.parent.user.namec || r.parent.user.username) : '—'),
    },
    { title: 'IP', dataIndex: 'ip', width: 110, render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    { title: 'IP 属地', dataIndex: 'ipLocation', width: 100, render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
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
          title="确定删除该评论？"
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
      <h1>评论管理</h1>
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
