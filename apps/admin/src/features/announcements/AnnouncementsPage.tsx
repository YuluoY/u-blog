import { useState } from 'react'
import {
  Table, Button, Tag, Popconfirm, Space, Modal, Form,
  Input, Switch, InputNumber, ColorPicker,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, NotificationOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useTableFilter } from '../../shared/hooks/useTableFilter'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import { useAnnouncements } from './useAnnouncements'
import { useAnnouncementMutations } from './useAnnouncementMutations'
import { WriteAction } from '../../shared/components/WriteAction'
import { useGuestMode } from '../../contexts/GuestModeContext'
import type { AnnouncementItem } from './api'

const { TextArea } = Input

/** 公告编辑弹窗 */
function AnnouncementFormModal({
  open,
  record,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean
  record: AnnouncementItem | null
  onClose: () => void
  onSubmit: (values: Partial<AnnouncementItem>) => void
  loading: boolean
}) {
  const [form] = Form.useForm()
  const isEdit = !!record

  // 弹窗打开时回填表单
  const handleAfterOpen = (open: boolean) => {
    if (open && record) {
      form.setFieldsValue({
        title: record.title,
        content: record.content ?? '',
        bgColor: record.bgColor ?? '#1677ff',
        textColor: record.textColor ?? '#ffffff',
        isActive: record.isActive,
        sort: record.sort,
      })
    } else if (open) {
      form.resetFields()
    }
  }

  return (
    <Modal
      title={isEdit ? '编辑公告' : '新增公告'}
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
        initialValues={{ isActive: true, sort: 0, bgColor: '#1677ff', textColor: '#ffffff' }}
        onFinish={(values) => {
          // ColorPicker 返回 Color 对象，需要转成 hex 字符串
          const bgColor = typeof values.bgColor === 'string'
            ? values.bgColor
            : values.bgColor?.toHexString?.() ?? '#1677ff'
          const textColor = typeof values.textColor === 'string'
            ? values.textColor
            : values.textColor?.toHexString?.() ?? '#ffffff'
          onSubmit({ ...values, bgColor, textColor })
        }}
      >
        <Form.Item
          name="title"
          label="横幅标题"
          rules={[{ required: true, message: '请输入公告标题' }]}
          extra="横幅上显示的简短文字"
        >
          <Input maxLength={255} placeholder="如：🎉 网站已全新改版上线，欢迎体验！" />
        </Form.Item>

        <Form.Item
          name="content"
          label="详情内容（Markdown）"
          extra="为空则点击横幅不会跳转，有内容则点击横幅进入详情页渲染 Markdown"
        >
          <TextArea rows={6} placeholder="支持 Markdown 语法，如不需要详情页可留空" />
        </Form.Item>

        <Space size="large">
          <Form.Item name="bgColor" label="横幅背景色">
            <ColorPicker />
          </Form.Item>
          <Form.Item name="textColor" label="文字颜色">
            <ColorPicker />
          </Form.Item>
        </Space>

        <Space size="large">
          <Form.Item name="isActive" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="sort" label="排序权重" extra="越大越靠前">
            <InputNumber min={0} max={9999} />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  )
}

export default function AnnouncementsPage() {
  const { data: list = [], isLoading } = useAnnouncements()
  const { create, update, remove } = useAnnouncementMutations()
  const { isGuest } = useGuestMode()

  const [modalOpen, setModalOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<AnnouncementItem | null>(null)

  const { filteredData, onSearch, pagination } = useTableFilter(
    list,
    ['title', 'content'],
  )

  const { containerRef, scrollY } = useTableScrollY({ hasPagination: true })

  /** 打开新增弹窗 */
  const handleAdd = () => {
    setEditRecord(null)
    setModalOpen(true)
  }

  /** 打开编辑弹窗 */
  const handleEdit = (record: AnnouncementItem) => {
    setEditRecord(record)
    setModalOpen(true)
  }

  /** 提交表单 */
  const handleSubmit = (values: Partial<AnnouncementItem>) => {
    if (editRecord) {
      update.mutate({ id: editRecord.id, ...values }, { onSuccess: () => setModalOpen(false) })
    } else {
      create.mutate(values, { onSuccess: () => setModalOpen(false) })
    }
  }

  const columns: ColumnsType<AnnouncementItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
      render: (text: string, record) => (
        <Space>
          <NotificationOutlined style={{ color: record.bgColor || '#1677ff' }} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '有详情',
      width: 80,
      render: (_, r) => r.content ? <Tag color="blue">有</Tag> : <Tag>无</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 80,
      render: (v: boolean) => v ? <Tag color="green">启用</Tag> : <Tag color="default">禁用</Tag>,
    },
    {
      title: '预览',
      width: 200,
      render: (_, r) => (
        <div
          style={{
            background: r.bgColor || '#1677ff',
            color: r.textColor || '#fff',
            padding: '2px 12px',
            borderRadius: 4,
            fontSize: 12,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {r.title}
        </div>
      ),
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 70,
      sorter: (a, b) => a.sort - b.sort,
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
              title="确定删除此公告？"
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
      <h1>公告管理</h1>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Input.Search
          placeholder="搜索标题 / 内容"
          allowClear
          onSearch={onSearch}
          style={{ width: 220 }}
        />
        <WriteAction>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增公告
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
            pagination={pagination}
            size="small"
          />
        </div>
      </div>
      <AnnouncementFormModal
        open={modalOpen}
        record={editRecord}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        loading={create.isPending || update.isPending}
      />
    </div>
  )
}
