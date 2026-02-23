import { useEffect } from 'react'
import { Modal, Form, Input, Switch, Select } from 'antd'
import type { RouteItem } from './api'

interface RouteFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>
  loading?: boolean
  initial?: RouteItem | null
  /** 所有路由（供选择父路由） */
  allRoutes?: RouteItem[]
}

export function RouteFormModal({
  open,
  onClose,
  onSubmit,
  loading,
  initial,
  allRoutes = [],
}: RouteFormModalProps) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        title: initial?.title ?? '',
        name: initial?.name ?? '',
        path: initial?.path ?? '',
        component: initial?.component ?? '',
        redirect: initial?.redirect ?? '',
        icon: initial?.icon ?? '',
        pid: initial?.pid ?? null,
        isKeepAlive: initial?.isKeepAlive ?? false,
        isAffix: initial?.isAffix ?? false,
        isExact: initial?.isExact ?? false,
        isProtected: initial?.isProtected ?? false,
        isHero: initial?.isHero ?? false,
        isLeftSide: initial?.isLeftSide ?? false,
        isRightSide: initial?.isRightSide ?? false,
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

  /** 父路由选项（排除自身） */
  const parentOptions = allRoutes
    .filter((r) => r.id !== initial?.id)
    .map((r) => ({ value: r.id, label: `${r.title || r.name} (${r.path})` }))

  return (
    <Modal
      title={initial ? '编辑路由' : '新增路由'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      destroyOnHidden={false}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="title" label="标题" rules={[{ max: 50, message: '最多50个字符' }]}>
          <Input placeholder="路由标题" maxLength={50} />
        </Form.Item>
        <Form.Item
          name="name"
          label="名称"
          rules={[{ required: true, message: '请输入路由名称' }, { max: 50, message: '最多50个字符' }]}
        >
          <Input placeholder="唯一名称，如 home" maxLength={50} />
        </Form.Item>
        <Form.Item
          name="path"
          label="路径"
          rules={[{ required: true, message: '请输入路由路径' }, { max: 255, message: '最多255个字符' }]}
        >
          <Input placeholder="/home" maxLength={255} />
        </Form.Item>
        <Form.Item name="component" label="组件路径" rules={[{ max: 255, message: '最多255个字符' }]}>
          <Input placeholder="组件路径" maxLength={255} />
        </Form.Item>
        <Form.Item name="redirect" label="重定向" rules={[{ max: 100, message: '最多100个字符' }]}>
          <Input placeholder="重定向路径" maxLength={100} />
        </Form.Item>
        <Form.Item name="icon" label="图标" rules={[{ max: 100, message: '最多100个字符' }]}>
          <Input placeholder="图标名" maxLength={100} />
        </Form.Item>
        <Form.Item name="pid" label="父路由">
          <Select
            allowClear
            placeholder="选择父路由（可选）"
            options={parentOptions}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Form.Item name="isKeepAlive" label="缓存" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isAffix" label="固定" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isExact" label="精确匹配" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isProtected" label="需鉴权" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isHero" label="Hero 封面" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isLeftSide" label="左侧栏" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isRightSide" label="右侧栏" valuePropName="checked">
            <Switch />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  )
}
