import { useState } from 'react'
import {
  Table, Button, Tag, Popconfirm, Space, Modal, Form,
  Input, Switch, Pagination,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  PushpinOutlined, EyeOutlined, EyeInvisibleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useTableFilter } from '../../shared/hooks/useTableFilter'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import { useMoments } from './useMoments'
import { useMomentMutations } from './useMomentMutations'
import { WriteAction } from '../../shared/components/WriteAction'
import { useGuestMode } from '../../contexts/GuestModeContext'
import type { MomentItem } from './api'

const { TextArea } = Input

/** 动态编辑弹窗 */
function MomentFormModal({
  open,
  record,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean
  record: MomentItem | null
  onClose: () => void
  onSubmit: (values: Partial<MomentItem>) => void
  loading: boolean
}) {
  const [form] = Form.useForm()
  const isEdit = !!record

  /** 弹窗打开时回填 / 重置表单 */
  const handleAfterOpen = (visible: boolean) => {
    if (visible && record) {
      form.setFieldsValue({
        content: record.content,
        mood: record.mood ?? '',
        weather: record.weather ?? '',
        tags: record.tags?.join(', ') ?? '',
        visibility: record.visibility === 'public',
        isPinned: record.isPinned,
      })
    } else if (visible) {
      form.resetFields()
    }
  }

  return (
    <Modal
      title={isEdit ? '编辑动态' : '新增动态'}
      open={open}
      onCancel={onClose}
      afterOpenChange={handleAfterOpen}
      onOk={() => form.submit()}
      confirmLoading={loading}
      destroyOnClose
      width={640}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ visibility: true, isPinned: false }}
        onFinish={(values) => {
          const tags = values.tags
            ? String(values.tags).split(/[,，]/).map((s: string) => s.trim()).filter(Boolean)
            : undefined
          onSubmit({
            content: values.content,
            mood: values.mood || undefined,
            weather: values.weather || undefined,
            tags: tags?.length ? tags : undefined,
            visibility: values.visibility ? 'public' : 'private',
            isPinned: values.isPinned ?? false,
          })
        }}
      >
        <Form.Item
          name="content"
          label="内容"
          rules={[{ required: true, message: '请输入动态内容' }]}
        >
          <TextArea rows={5} maxLength={5000} placeholder="写点什么…" showCount />
        </Form.Item>

        <Form.Item name="mood" label="心情" extra="如：开心、沉思">
          <Input maxLength={50} placeholder="可选" />
        </Form.Item>

        <Form.Item name="weather" label="天气" extra="如：晴、多云">
          <Input maxLength={50} placeholder="可选" />
        </Form.Item>

        <Form.Item name="tags" label="标签" extra="多个标签用逗号分隔">
          <Input placeholder="如：生活, 技术, 读书" />
        </Form.Item>

        <Space size="large">
          <Form.Item name="visibility" label="公开" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isPinned" label="置顶" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  )
}

/** 内容预览：截取前 80 个字符 */
function contentPreview(text: string, max = 80): string {
  if (!text) return '-'
  return text.length > max ? text.slice(0, max) + '…' : text
}

export default function MomentsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const { data, isLoading } = useMoments(page, pageSize)
  const list = data?.list ?? []
  const total = data?.total ?? 0

  const { create, update, remove } = useMomentMutations()
  const { isGuest } = useGuestMode()

  const [modalOpen, setModalOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<MomentItem | null>(null)

  const { filteredData, onSearch } = useTableFilter(
    list,
    ['content', (item) => item.mood ?? '', (item) => item.weather ?? ''],
  )

  const { containerRef, scrollY } = useTableScrollY({ hasPagination: true })

  /** 打开新增弹窗 */
  const handleAdd = () => {
    setEditRecord(null)
    setModalOpen(true)
  }

  /** 打开编辑弹窗 */
  const handleEdit = (record: MomentItem) => {
    setEditRecord(record)
    setModalOpen(true)
  }

  /** 提交表单（新增 / 更新） */
  const handleSubmit = (values: Partial<MomentItem>) => {
    if (editRecord) {
      update.mutate({ id: editRecord.id, ...values }, { onSuccess: () => setModalOpen(false) })
    } else {
      create.mutate(values, { onSuccess: () => setModalOpen(false) })
    }
  }

  /** 分页变更 */
  const handlePageChange = (p: number, ps: number) => {
    setPage(p)
    setPageSize(ps)
  }

  const columns: ColumnsType<MomentItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: '内容',
      dataIndex: 'content',
      ellipsis: true,
      render: (text: string) => contentPreview(text),
    },
    {
      title: '作者',
      width: 100,
      render: (_, r) => r.user?.namec || r.user?.username || '-',
    },
    {
      title: '可见',
      dataIndex: 'visibility',
      width: 80,
      render: (v: string) =>
        v === 'public'
          ? <Tag icon={<EyeOutlined />} color="green">公开</Tag>
          : <Tag icon={<EyeInvisibleOutlined />} color="orange">私密</Tag>,
    },
    {
      title: '置顶',
      dataIndex: 'isPinned',
      width: 70,
      render: (v: boolean) =>
        v ? <Tag icon={<PushpinOutlined />} color="blue">是</Tag> : <Tag>否</Tag>,
    },
    {
      title: '点赞',
      dataIndex: 'likeCount',
      width: 70,
      sorter: (a, b) => a.likeCount - b.likeCount,
    },
    {
      title: '评论',
      dataIndex: 'commentCount',
      width: 70,
      sorter: (a, b) => a.commentCount - b.commentCount,
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (v: string) => v ? new Date(v).toLocaleString() : '-',
      sorter: (a, b) =>
        new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
    },
    {
      title: '操作',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <WriteAction>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </WriteAction>
          {!isGuest && (
            <Popconfirm
              title="确定删除此动态？"
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
      <h1>动态管理</h1>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Input.Search
          placeholder="搜索内容 / 心情 / 天气"
          allowClear
          onSearch={onSearch}
          style={{ width: 240 }}
        />
        <WriteAction>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增动态
          </Button>
        </WriteAction>
      </div>
      <div className="admin-content__table-wrap">
        <div ref={containerRef} className="admin-content__table-body">
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredData}
            loading={isLoading}
            scroll={{ y: scrollY }}
            pagination={false}
            size="small"
          />
        </div>
      </div>
      {/* 服务端分页 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger
          showTotal={(t) => `共 ${t} 条`}
          pageSizeOptions={['10', '20', '50', '100']}
          onChange={handlePageChange}
        />
      </div>
      <MomentFormModal
        open={modalOpen}
        record={editRecord}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        loading={create.isPending || update.isPending}
      />
    </div>
  )
}
