import { useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Select } from 'antd'
import type { FriendLinkItem } from './api'

interface FriendLinkFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>
  loading?: boolean
  initial?: FriendLinkItem | null
}

const STATUS_OPTIONS = [
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
]

export function FriendLinkFormModal({
  open,
  onClose,
  onSubmit,
  loading,
  initial,
}: FriendLinkFormModalProps) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        title: initial?.title ?? '',
        url: initial?.url ?? '',
        icon: initial?.icon ?? '',
        description: initial?.description ?? '',
        email: initial?.email ?? '',
        status: initial?.status ?? 'approved',
        sortOrder: initial?.sortOrder ?? 0,
      })
    }
  }, [open, initial, form])

  const handleOk = async () => {
    const values = await form.validateFields()
    await Promise.resolve(onSubmit(values))
    form.resetFields()
    onClose()
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title={initial ? '编辑友链' : '新增友链'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      destroyOnHidden={false}
      width={560}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label="网站标题"
          rules={[{ required: true, message: '请输入标题' }, { max: 200, message: '最多200个字符' }]}
        >
          <Input placeholder="网站标题" maxLength={200} showCount />
        </Form.Item>
        <Form.Item
          name="url"
          label="网站 URL"
          rules={[
            { required: true, message: '请输入 URL' },
            { type: 'url', message: '请输入合法 URL' },
            { max: 500, message: '最多500个字符' },
          ]}
        >
          <Input placeholder="https://example.com" maxLength={500} />
        </Form.Item>
        <Form.Item name="icon" label="图标 URL" rules={[{ max: 500, message: '最多500个字符' }]}>
          <Input placeholder="favicon URL" maxLength={500} />
        </Form.Item>
        <Form.Item name="description" label="描述" rules={[{ max: 500, message: '最多500个字符' }]}>
          <Input.TextArea placeholder="网站描述" maxLength={500} rows={2} showCount />
        </Form.Item>
        <Form.Item name="email" label="申请人邮箱" rules={[{ type: 'email', message: '邮箱格式不正确' }]}>
          <Input placeholder="可选，用于通知" maxLength={200} />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select options={STATUS_OPTIONS} />
        </Form.Item>
        <Form.Item name="sortOrder" label="排序权重">
          <InputNumber min={0} max={9999} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
