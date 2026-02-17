import { useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import { formatDateTime, formatDateRelative } from '../../shared/utils/formatDate'
import { useUsers } from './useUsers'
import { useUserMutations } from './useUserMutations'
import type { UserItem } from './api'

const ROLE_OPTIONS = [
  { value: 'super_admin', label: '超级管理员' },
  { value: 'admin', label: '管理员' },
  { value: 'user', label: '用户' },
]

export default function UsersPage() {
  const { data: list = [], isLoading } = useUsers()
  const { update } = useUserMutations()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<UserItem | null>(null)
  const [form] = Form.useForm()

  const handleEdit = (record: UserItem) => {
    setEditing(record)
    form.setFieldsValue({
      namec: record.namec ?? '',
      role: record.role ?? 'user',
      bio: record.bio ?? '',
      location: record.location ?? '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    if (!editing) return
    await update.mutateAsync({ id: editing.id, ...values })
    setModalOpen(false)
    setEditing(null)
  }

  const columns: ColumnsType<UserItem> = [
    { title: 'ID', dataIndex: 'id', width: 70, align: 'center' },
    { title: '用户名', dataIndex: 'username', width: 120, align: 'center' },
    { title: '邮箱', dataIndex: 'email', width: 180,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    { title: '昵称', dataIndex: 'namec', width: 100, align: 'center' },
    { title: '角色', dataIndex: 'role', width: 100, align: 'center' },
    { title: '头像', dataIndex: 'avatar', width: 120,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    { title: '简介', dataIndex: 'bio', width: 140,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    { title: '所在地', dataIndex: 'location', width: 110,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    {
      title: '创建',
      dataIndex: 'createdAt',
      width: 110,
      align: 'center',
      render: (v: string) => (v ? <Tooltip title={formatDateTime(v)}>{formatDateRelative(v)}</Tooltip> : '—'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => handleEdit(record)}>
          编辑
        </Button>
      ),
    },
  ]

  const { containerRef, scrollY } = useTableScrollY()

  return (
    <div className="admin-content">
      <h1>用户管理</h1>
      <div className="admin-content__table-wrap">
        <div ref={containerRef} className="admin-content__table-body">
          <Table
            rowKey="id"
            columns={columns}
            dataSource={list}
            loading={isLoading}
            pagination={{ pageSize: 20 }}
            scroll={{ y: scrollY }}
          />
        </div>
      </div>
      <Modal
        title={`编辑用户: ${editing?.username ?? ''}`}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setModalOpen(false)
          setEditing(null)
          form.resetFields()
        }}
        confirmLoading={update.isPending}
        destroyOnHidden={false}
        width={480}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="namec" label="昵称">
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
          <Form.Item name="bio" label="简介">
            <Input.TextArea rows={2} maxLength={255} />
          </Form.Item>
          <Form.Item name="location" label="所在地">
            <Input maxLength={255} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
