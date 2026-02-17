import { useEffect } from 'react'
import { Modal, Form, Input, Popover } from 'antd'
import GradientColorPicker from 'react-best-gradient-color-picker'
import type { TagItem } from './api'

/** 与 Form 联动的颜色/渐变选择器：直接展示颜色效果块，点击弹出选择器 */
function ColorPickerFormField({
  value,
  onChange,
}: {
  value?: string
  onChange?: (v: string) => void
}) {
  const colorValue = value || '#1890ff'
  return (
    <Popover
      trigger="click"
      content={
        <GradientColorPicker
          value={colorValue}
          onChange={(v) => onChange?.(v)}
          hideEyeDrop
          hideAdvancedSliders
          hideColorGuide
          width={280}
          height={160}
          locales={{ CONTROLS: { SOLID: '纯色', GRADIENT: '渐变' } }}
        />
      }
    >
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => e.currentTarget.focus()}
        onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLElement).click()}
        style={{
          width: 56,
          height: 32,
          borderRadius: 6,
          background: colorValue,
          border: '1px solid #d9d9d9',
          cursor: 'pointer',
        }}
        aria-label="选择颜色"
      />
    </Popover>
  )
}

interface TagFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: { name: string; desc?: string; color?: string }) => void | Promise<void>
  loading?: boolean
  initial?: TagItem | null
}

export function TagFormModal({
  open,
  onClose,
  onSubmit,
  loading,
  initial,
}: TagFormModalProps) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: initial?.name ?? '',
        desc: initial?.desc ?? '',
        color: initial?.color ?? '',
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
      title={initial ? '编辑标签' : '新增标签'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      destroyOnHidden={false}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="标签名称"
          rules={[{ required: true, message: '请输入标签名称' }, { max: 50, message: '最多50个字符' }]}
        >
          <Input placeholder="标签名称" maxLength={50} showCount />
        </Form.Item>
        <Form.Item name="color" label="颜色">
          <ColorPickerFormField />
        </Form.Item>
        <Form.Item name="desc" label="描述" rules={[{ max: 255 }]}>
          <Input.TextArea placeholder="标签描述" maxLength={255} rows={3} showCount />
        </Form.Item>
      </Form>
    </Modal>
  )
}
