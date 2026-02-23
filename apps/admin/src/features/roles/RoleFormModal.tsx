import { useEffect } from 'react'
import { Modal, Form, Input, Select, Spin } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { restQuery } from '../../shared/api/rest'
import type { RoleItem, PermissionItem } from './api'

interface RoleFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: { name: string; desc: string; permissions?: { id: number }[] }) => void | Promise<void>
  loading?: boolean
  initial?: RoleItem | null
}

/** 获取所有权限供选择 */
function useAllPermissions() {
  return useQuery({
    queryKey: ['all-permissions'],
    queryFn: () => restQuery<PermissionItem[]>('permission', { take: 500, order: { id: 'ASC' } }),
  })
}

export function RoleFormModal({
  open,
  onClose,
  onSubmit,
  loading,
  initial,
}: RoleFormModalProps) {
  const [form] = Form.useForm()
  const { data: allPerms = [], isLoading: permsLoading } = useAllPermissions()

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: initial?.name ?? '',
        desc: initial?.desc ?? '',
        permissionIds: initial?.permissions?.map((p) => p.id) ?? [],
      })
    }
  }, [open, initial, form])

  const handleOk = async () => {
    const values = await form.validateFields()
    const { permissionIds, ...rest } = values
    const permissions = (permissionIds as number[] | undefined)?.map((id: number) => ({ id }))
    await Promise.resolve(onSubmit({ ...rest, permissions }))
    form.resetFields()
    onClose()
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title={initial ? '编辑角色' : '新增角色'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      destroyOnHidden={false}
      width={560}
    >
      <Spin spinning={permsLoading}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }, { max: 50, message: '最多50个字符' }]}
          >
            <Input placeholder="角色名称" maxLength={50} showCount />
          </Form.Item>
          <Form.Item
            name="desc"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }, { max: 255, message: '最多255个字符' }]}
          >
            <Input.TextArea placeholder="角色描述" maxLength={255} rows={2} showCount />
          </Form.Item>
          <Form.Item name="permissionIds" label="关联权限">
            <Select
              mode="multiple"
              placeholder="选择权限"
              allowClear
              showSearch
              optionFilterProp="label"
              options={allPerms.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }))}
            />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  )
}
