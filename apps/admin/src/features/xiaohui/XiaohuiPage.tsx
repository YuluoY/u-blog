import { useState, useMemo } from 'react'
import { Table, Button, Tag, Popconfirm, Space, Modal, Typography, Select, Input } from 'antd'
import { DeleteOutlined, EyeOutlined, ReloadOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import { useXiaohuiConversations } from './useXiaohuiConversations'
import { useXiaohuiMutations } from './useXiaohuiMutations'
import { exportToJSON } from '../../shared/utils/exportData'
import { WriteAction } from '../../shared/components/WriteAction'
import { useGuestMode } from '../../contexts/GuestModeContext'
import type { XiaohuiConversationItem } from './api'

const { Paragraph, Text } = Typography

/** 对话详情预览弹窗 */
function ConversationDetailModal({
  record,
  open,
  onClose,
}: {
  record: XiaohuiConversationItem | null
  open: boolean
  onClose: () => void
}) {
  if (!record) return null

  return (
    <Modal
      title={`对话详情 #${record.id}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
    >
      <div style={{ maxHeight: 500, overflow: 'auto' }}>
        {record.context?.map((msg, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: 12,
              padding: '8px 12px',
              borderRadius: 8,
              background: msg.role === 'user' ? '#f0f0ff' : '#f6f6f6',
            }}
          >
            <Text strong style={{ color: msg.role === 'user' ? '#7c3aed' : '#333' }}>
              {msg.role === 'user' ? '用户' : '小惠'}
            </Text>
            <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
              {new Date(msg.timestamp).toLocaleString()}
            </Text>
            <Paragraph
              style={{ marginTop: 4, marginBottom: 0, whiteSpace: 'pre-wrap' }}
              ellipsis={{ rows: 10, expandable: true }}
            >
              {msg.content}
            </Paragraph>
          </div>
        ))}
        {!record.context?.length && (
          <div style={{ padding: 12 }}>
            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ color: '#7c3aed' }}>用户：</Text>
              <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {record.userMessage}
              </Paragraph>
            </div>
            {record.assistantMessage && (
              <div>
                <Text strong>小惠：</Text>
                <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {record.assistantMessage}
                </Paragraph>
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ marginTop: 12, color: '#888', fontSize: 12 }}>
        会话ID: {record.sessionId} | IP: {record.clientIp || '未知'} | 耗时: {record.latencyMs ?? '-'}ms
      </div>
    </Modal>
  )
}

export default function XiaohuiPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [keyword, setKeyword] = useState('')
  const { data: list = [], isLoading, refetch } = useXiaohuiConversations({
    take: pageSize,
    skip: (page - 1) * pageSize,
    status: statusFilter || undefined,
  })
  const { remove } = useXiaohuiMutations()
  const { isGuest } = useGuestMode()
  const [detailRecord, setDetailRecord] = useState<XiaohuiConversationItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const { containerRef, scrollY } = useTableScrollY({ hasPagination: true })

  // 客户端关键词过滤（对当前页数据）
  const filteredData = useMemo(() => {
    if (!keyword) return list
    const kw = keyword.toLowerCase()
    return list.filter((item) =>
      String(item.id).includes(kw)
      || (item.userMessage ?? '').toLowerCase().includes(kw)
      || (item.assistantMessage ?? '').toLowerCase().includes(kw)
      || (item.clientIp ?? '').toLowerCase().includes(kw)
      || (item.status ?? '').toLowerCase().includes(kw),
    )
  }, [list, keyword])

  const columns: ColumnsType<XiaohuiConversationItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: '用户',
      width: 120,
      render: (_, r) => r.user
        ? <span>{r.user.namec || r.user.username}</span>
        : <Tag color="default">游客</Tag>,
    },
    {
      title: 'IP',
      dataIndex: 'clientIp',
      width: 120,
      ellipsis: true,
    },
    {
      title: '用户消息',
      dataIndex: 'userMessage',
      ellipsis: true,
      render: (text: string) => (
        <span title={text}>{text.length > 60 ? text.slice(0, 60) + '...' : text}</span>
      ),
    },
    {
      title: '回复摘要',
      dataIndex: 'assistantMessage',
      ellipsis: true,
      render: (text: string | null) => text
        ? <span title={text}>{text.length > 60 ? text.slice(0, 60) + '...' : text}</span>
        : <Text type="secondary">-</Text>,
    },
    {
      title: '耗时',
      dataIndex: 'latencyMs',
      width: 80,
      render: (v: number | null) => v != null ? `${(v / 1000).toFixed(1)}s` : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          success: 'green',
          error: 'red',
          aborted: 'orange',
        }
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
      },
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (v: string) => new Date(v).toLocaleString(),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '操作',
      width: 100,
      render: (_: unknown, record: XiaohuiConversationItem) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setDetailRecord(record)
              setDetailOpen(true)
            }}
          />
          {!isGuest && (
            <Popconfirm
              title="确定删除此对话记录？"
              onConfirm={() => remove.mutate(record.id)}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={remove.isPending}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="admin-content">
      <h1>小惠对话管理</h1>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Input.Search
          placeholder="搜索 ID / 消息 / IP / 状态"
          allowClear
          onSearch={(v) => setKeyword(v)}
          style={{ width: 220 }}
          prefix={<SearchOutlined />}
        />
        <Select
          placeholder="筛选状态"
          allowClear
          style={{ width: 140 }}
          value={statusFilter || undefined}
          onChange={(v) => { setStatusFilter(v || ''); setPage(1) }}
          options={[
            { label: '成功', value: 'success' },
            { label: '失败', value: 'error' },
            { label: '中断', value: 'aborted' },
          ]}
        />
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
          刷新
        </Button>
        <WriteAction>
          <Button icon={<DownloadOutlined />} onClick={() => exportToJSON(list, 'xiaohui-conversations')}>
            导出
          </Button>
        </WriteAction>
        <Text type="secondary" style={{ marginLeft: 'auto' }}>
          共 {list.length} 条记录
        </Text>
      </div>
      <div className="admin-content__table-wrap">
        <div ref={containerRef} className="admin-content__table-body">
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredData}
            loading={isLoading}
            scroll={{ y: scrollY }}
            pagination={{
              current: page,
              pageSize,
              onChange: (p, ps) => { setPage(p); setPageSize(ps) },
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => `共 ${total} 条`,
            }}
            size="small"
          />
        </div>
      </div>
      <ConversationDetailModal
        record={detailRecord}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  )
}
