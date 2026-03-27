import { useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Tooltip, Upload } from 'antd'
import { DownloadOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import { useTableFilter } from '../../shared/hooks/useTableFilter'
import { formatDateTime, formatDateRelative } from '../../shared/utils/formatDate'
import { exportToJSON } from '../../shared/utils/exportData'
import { WriteAction } from '../../shared/components/WriteAction'
import { useGuestMode } from '../../contexts/GuestModeContext'
import { uploadFile } from '../../shared/api/upload'
import { useUsers } from './useUsers'
import { useUserMutations } from './useUserMutations'
import type { UserItem } from './api'

const ROLE_OPTIONS = [
  { value: 'super_admin', label: '超级管理员' },
  { value: 'admin', label: '管理员' },
  { value: 'user', label: '用户' },
]

/** 解析所在地 JSON，返回可读文本；格式：{labels:['省','市','区'],detail?} */
function parseLocationLabel(raw: string | null | undefined): string {
  if (!raw) return '—'
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed?.labels) && parsed.labels.length > 0) {
      const base = parsed.labels.join('')
      return parsed.detail ? `${base} ${parsed.detail}` : base
    }
  } catch {}
  return raw
}

export default function UsersPage() {
  const { data: list = [], isLoading } = useUsers()
  const { update } = useUserMutations()
  const { isGuest } = useGuestMode()
  const { filteredData, onSearch, pagination } = useTableFilter(
    list, ['id', 'username', 'email', 'namec', 'role'] as (keyof UserItem)[], { defaultPageSize: 20 },
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<UserItem | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [form] = Form.useForm()
  /** 响应式监听头像字段，确保上传后预览即时刷新 */
  const avatarPreview = Form.useWatch('avatar', form)

  const handleEdit = (record: UserItem) => {
    setEditing(record)
    form.setFieldsValue({
      namec: record.namec ?? '',
      role: record.role ?? 'user',
      bio: record.bio ?? '',
      location: record.location ?? '',
      avatar: record.avatar ?? '',
    })
    setModalOpen(true)
  }

  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true)
    try {
      const result = await uploadFile(file)
      form.setFieldValue('avatar', result.url)
    } catch {
      // uploadFile 内部已有全局错误提示
    } finally {
      setAvatarUploading(false)
    }
    return false // 阻止 Upload 组件自动上传
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    if (!editing) return
    await update.mutateAsync({ id: editing.id, ...values })
    setModalOpen(false)
    setEditing(null)
  }

  const columns: ColumnsType<UserItem> = [
    { title: 'ID', dataIndex: 'id', width: 70, align: 'center', sorter: (a, b) => a.id - b.id },
    { title: '用户名', dataIndex: 'username', width: 120, align: 'center' },
    { title: '邮箱', dataIndex: 'email', width: 180,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    { title: '昵称', dataIndex: 'namec', width: 100, align: 'center' },
    {
      title: '角色',
      dataIndex: 'role',
      width: 100,
      align: 'center',
      filters: [
        { text: '超级管理员', value: 'super_admin' },
        { text: '管理员', value: 'admin' },
        { text: '用户', value: 'user' },
      ],
      onFilter: (value, record) => record.role === value,
    },
    { title: '头像', dataIndex: 'avatar', width: 80, align: 'center' as const,  render: (v: string) => v ? <img src={v} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} /> : '—' },
    { title: '简介', dataIndex: 'bio', width: 140,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    { title: '所在地', dataIndex: 'location', width: 110,  render: (v: string) => { const label = parseLocationLabel(v); return <Tooltip title={label}><div className="admin-table-cell-ellipsis-2">{label}</div></Tooltip> } },
    {
      title: '创建',
      dataIndex: 'createdAt',
      width: 110,
      align: 'center',
      sorter: (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
      render: (v: string) => (v ? <Tooltip title={formatDateTime(v)}>{formatDateRelative(v)}</Tooltip> : '—'),
    },
    ...(!isGuest ? ([{
      title: '操作',
      key: 'action',
      width: 80,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_: unknown, record: UserItem) => (
        <Button type="link" size="small" onClick={() => handleEdit(record)}>
          编辑
        </Button>
      ),
    }] as ColumnsType<UserItem>) : []),
  ]

  const { containerRef, scrollY } = useTableScrollY()

  return (
    <div className="admin-content">
      <h1>用户管理</h1>
      <div className="admin-content__table-wrap">
        <div ref={containerRef} className="admin-content__table-body">
          <div className="admin-content__toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Input.Search placeholder="搜索 ID / 用户名 / 邮箱 / 昵称 / 角色" allowClear onSearch={onSearch} style={{ width: 260 }} prefix={<SearchOutlined />} />
            <WriteAction>
              <Button icon={<DownloadOutlined />} onClick={() => exportToJSON(list, 'users')}>导出</Button>
            </WriteAction>
          </div>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredData}
            loading={isLoading}
            pagination={pagination}
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
          <Form.Item name="avatar" label="头像">
            <Input placeholder="头像 URL" />
          </Form.Item>
          <Form.Item>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Upload
                accept="image/jpeg,image/png,image/webp,image/gif"
                showUploadList={false}
                beforeUpload={(file) => { handleAvatarUpload(file); return false }}
              >
                <Button icon={<UploadOutlined />} loading={avatarUploading} size="small">上传头像</Button>
              </Upload>
              {avatarPreview && (
                <img
                  src={avatarPreview}
                  alt="preview"
                  style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                />
              )}
            </div>
          </Form.Item>
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
