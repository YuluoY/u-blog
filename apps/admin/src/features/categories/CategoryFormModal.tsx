import { useEffect } from 'react'
import { Modal, Form, Input } from 'antd'
import type { CategoryItem } from './api'

interface CategoryFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: { name: string; desc?: string }) => void | Promise<void>
  loading?: boolean
  initial?: CategoryItem | null
}

export function CategoryFormModal({
  open,
  onClose,
  onSubmit,
  loading,
  initial,
}: CategoryFormModalProps) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: initial?.name ?? '',
        desc: initial?.desc ?? '',
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
      title={initial ? '编辑分类' : '新增分类'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      destroyOnHidden={false}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="分类名称"
          rules={[{ required: true, message: '请输入分类名称' }, { max: 50, message: '最多50个字符' }]}
        >
          <Input placeholder="分类名称" maxLength={50} showCount />
        </Form.Item>
        <Form.Item name="desc" label="描述" rules={[{ max: 255, message: '最多255个字符' }]}>
          <Input.TextArea placeholder="分类描述" maxLength={255} rows={3} showCount />
        </Form.Item>
      </Form>
    </Modal>
  )
}
