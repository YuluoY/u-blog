import { useEffect } from 'react'
import { Modal, Form, Input, Select } from 'antd'
import type { PermissionItem } from './api'

interface PermissionFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>
  loading?: boolean
  initial?: PermissionItem | null
}

const TYPE_OPTIONS = [
  { value: 'menu', label: '菜单' },
  { value: 'api', label: '接口' },
  { value: 'button', label: '按钮' },
  { value: 'page', label: '页面' },
]

const ACTION_OPTIONS = [
  { value: 'create', label: '创建' },
  { value: 'read', label: '读取' },
  { value: 'update', label: '更新' },
  { value: 'delete', label: '删除' },
  { value: 'manage', label: '管理' },
]

export function PermissionFormModal({
  open,
  onClose,
  onSubmit,
  loading,
  initial,
}: PermissionFormModalProps) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: initial?.name ?? '',
        code: initial?.code ?? '',
        desc: initial?.desc ?? '',
        type: initial?.type ?? 'api',
        resource: initial?.resource ?? '',
        action: initial?.action ?? 'read',
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
      title={initial ? '编辑权限' : '新增权限'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      destroyOnHidden={false}
      width={520}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="权限名称"
          rules={[{ required: true, message: '请输入名称' }, { max: 100, message: '最多100个字符' }]}
        >
          <Input placeholder="权限名称" maxLength={100} showCount />
        </Form.Item>
        <Form.Item
          name="code"
          label="权限编码"
          rules={[{ required: true, message: '请输入编码' }, { max: 100, message: '最多100个字符' }]}
        >
          <Input placeholder="如 article:create" maxLength={100} showCount />
        </Form.Item>
        <Form.Item name="desc" label="描述" rules={[{ max: 255, message: '最多255个字符' }]}>
          <Input.TextArea placeholder="权限描述" maxLength={255} rows={2} showCount />
        </Form.Item>
        <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
          <Select options={TYPE_OPTIONS} />
        </Form.Item>
        <Form.Item name="resource" label="资源标识" rules={[{ max: 100, message: '最多100个字符' }]}>
          <Input placeholder="如 article、user" maxLength={100} />
        </Form.Item>
        <Form.Item name="action" label="操作类型" rules={[{ required: true, message: '请选择操作类型' }]}>
          <Select options={ACTION_OPTIONS} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
