import { Table, Button, Popconfirm, Tooltip, Input, Tag } from 'antd'
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import { useTableFilter } from '../../shared/hooks/useTableFilter'
import { formatDateTime, formatDateRelative } from '../../shared/utils/formatDate'
import { exportToJSON } from '../../shared/utils/exportData'
import { WriteAction } from '../../shared/components/WriteAction'
import { useGuestMode } from '../../contexts/GuestModeContext'
import { useLikes } from './useLikes'
import { useLikeMutations } from './useLikeMutations'
import type { LikeItem } from './api'

/** 点赞管理页面（只读 + 删除） */
export default function LikesPage() {
  const { data: list = [], isLoading } = useLikes()
  const { remove } = useLikeMutations()
  const { isGuest } = useGuestMode()
  const { filteredData, onSearch, pagination } = useTableFilter(
    list,
    ['id', 'ip', 'fingerprint'] as (keyof LikeItem)[],
    { defaultPageSize: 20 },
  )

  const columns: ColumnsType<LikeItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
      align: 'center',
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: '类型',
      key: 'type',
      width: 90,
      align: 'center',
      render: (_: unknown, r: LikeItem) =>
        r.articleId ? <Tag color="blue">文章</Tag> : <Tag color="green">评论</Tag>,
      filters: [
        { text: '文章', value: 'article' },
        { text: '评论', value: 'comment' },
      ],
      onFilter: (value, r) =>
        value === 'article' ? r.articleId != null : r.commentId != null,
    },
    {
      title: '用户',
      key: 'username',
      width: 110,
      align: 'center',
      render: (_: unknown, r: LikeItem) =>
        r.user ? (r.user.namec || r.user.username) : <Tag>游客</Tag>,
    },
    {
      title: '文章',
      key: 'articleTitle',
      width: 180,
      render: (_: unknown, r: LikeItem) =>
        r.article?.title ? (
          <Tooltip title={r.article.title}>
            <div className="admin-table-cell-ellipsis-2">{r.article.title}</div>
          </Tooltip>
        ) : '—',
    },
    {
      title: '评论',
      key: 'commentContent',
      width: 180,
      render: (_: unknown, r: LikeItem) =>
        r.comment?.content ? (
          <Tooltip title={r.comment.content}>
            <div className="admin-table-cell-ellipsis-2">{r.comment.content}</div>
          </Tooltip>
        ) : '—',
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      width: 120,
      render: (v: string) => v ?? '—',
    },
    {
      title: '指纹',
      dataIndex: 'fingerprint',
      width: 140,
      render: (v: string) =>
        v ? (
          <Tooltip title={v}>
            <div className="admin-table-cell-ellipsis-2">{v}</div>
          </Tooltip>
        ) : '—',
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 110,
      align: 'center',
      sorter: (a, b) =>
        new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
      render: (v: string) =>
        v ? (
          <Tooltip title={formatDateTime(v)}>{formatDateRelative(v)}</Tooltip>
        ) : '—',
    },
    ...(!isGuest
      ? [
          {
            title: '操作',
            key: 'action',
            width: 80,
            align: 'center' as const,
            fixed: 'right' as const,
            render: (_: unknown, record: LikeItem) => (
              <Popconfirm
                title="确定删除该点赞记录？"
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
      : []),
  ]

  const { containerRef, scrollY } = useTableScrollY()

  return (
    <div className="admin-content">
      <h1>点赞管理</h1>
      <div className="admin-content__table-wrap">
        <div ref={containerRef} className="admin-content__table-body">
          <div
            className="admin-content__toolbar"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Input.Search
              placeholder="搜索 ID / IP / 指纹"
              allowClear
              onSearch={onSearch}
              style={{ width: 240 }}
              prefix={<SearchOutlined />}
            />
            <WriteAction>
              <Button icon={<DownloadOutlined />} onClick={() => exportToJSON(list, 'likes')}>
                导出
              </Button>
            </WriteAction>
          </div>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredData}
            loading={isLoading}
            pagination={pagination}
            scroll={{ y: scrollY }}
          />
        </div>
      </div>
    </div>
  )
}
