import { useState } from 'react'
import { Table, Button, Modal, Form, Input, Segmented, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import { formatDateTime, formatDateRelative } from '../../shared/utils/formatDate'
import { useSettings } from './useSettings'
import { useSettingMutations } from './useSettingMutations'
import type { SettingItem } from './api'

export default function SettingsPage() {
  const { data: list = [], isLoading } = useSettings()
  const { update } = useSettingMutations()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SettingItem | null>(null)
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')
  const [form] = Form.useForm()

  const handleEdit = (record: SettingItem) => {
    setEditing(record)
    const v = record.value
    form.setFieldsValue({
      value: typeof v === 'string' ? v : JSON.stringify(v ?? '', null, 2),
      desc: record.desc ?? '',
    })
    setViewMode('edit')
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const { value, desc } = await form.validateFields()
    if (!editing) return
    let parsed: unknown = value
    try {
      parsed = JSON.parse(value)
    } catch {
      // 保持字符串
    }
    await update.mutateAsync({ id: editing.id, value: parsed, desc })
    setModalOpen(false)
    setEditing(null)
  }

  const columns: ColumnsType<SettingItem> = [
    { title: 'ID', dataIndex: 'id', width: 70, align: 'center' },
    { title: '键', dataIndex: 'key', width: 160,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    {
      title: '值',
      dataIndex: 'value',
      width: 200,
      render: (v: unknown) => {
        const text = typeof v === 'string' ? v : v != null ? JSON.stringify(v) : '—'
        return (
          <Tooltip title={text}>
            <div className="admin-table-cell-ellipsis-2">{text}</div>
          </Tooltip>
        )
      },
    },
    { title: '描述', dataIndex: 'desc', width: 160,  render: (v: string) => <Tooltip title={v}><div className="admin-table-cell-ellipsis-2">{v ?? '—'}</div></Tooltip> },
    { title: 'routeId', dataIndex: 'routeId', width: 88, align: 'center' },
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

  const { containerRef, scrollY } = useTableScrollY({ hasPagination: false })

  return (
    <div className="admin-content">
      <h1>设置</h1>
      <div className="admin-content__table-wrap">
        <div ref={containerRef} className="admin-content__table-body">
          <Table
            rowKey="id"
            columns={columns}
            dataSource={list}
            loading={isLoading}
            pagination={false}
            scroll={{ y: scrollY }}
          />
        </div>
      </div>
      <Modal
        title={`编辑设置: ${editing?.key ?? ''}`}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setModalOpen(false)
          setEditing(null)
          form.resetFields()
        }}
        confirmLoading={update.isPending}
        destroyOnHidden={false}
        width={560}
      >
        <Segmented
          options={[{ label: '编辑', value: 'edit' }, { label: '预览', value: 'preview' }]}
          value={viewMode}
          onChange={(v) => setViewMode(v as 'edit' | 'preview')}
          style={{ marginBottom: 16 }}
        />
        {viewMode === 'edit' && (
          <Form form={form} layout="vertical">
            <Form.Item name="value" label="值" rules={[{ required: true }]}>
              <Input.TextArea rows={6} placeholder="字符串或 JSON" />
            </Form.Item>
            <Form.Item name="desc" label="描述">
              <Input placeholder="描述" maxLength={255} />
            </Form.Item>
          </Form>
        )}
        {viewMode === 'preview' && (
          <div style={{ marginTop: 8 }}>
            <div style={{ marginBottom: 8, color: '#666' }}>键：{editing?.key}</div>
            <div style={{ marginBottom: 8, color: '#666' }}>描述：{editing?.desc ?? '—'}</div>
            <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, overflow: 'auto', maxHeight: 320 }}>
              {(() => {
                const v = form.getFieldValue('value')
                if (v == null || v === '') return '—'
                try {
                  return JSON.stringify(JSON.parse(v), null, 2)
                } catch {
                  return String(v)
                }
              })()}
            </pre>
          </div>
        )}
      </Modal>
    </div>
  )
}
