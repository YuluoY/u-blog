import { useState, useEffect, useCallback } from 'react'
import { Table, Button, Modal, Form, Input, Segmented, Tooltip, Card, Row, Col, Switch, message, Divider, Space } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import { formatDateTime, formatDateRelative } from '../../shared/utils/formatDate'
import { exportToJSON } from '../../shared/utils/exportData'
import { WriteAction } from '../../shared/components/WriteAction'
import { useGuestMode } from '../../contexts/GuestModeContext'
import { useSettings } from './useSettings'
import { useSettingMutations } from './useSettingMutations'
import type { SettingItem } from './api'
import { getSettingsByKeys, saveSettings } from './api'

/** Footer 相关设置 key */
const FOOTER_KEYS = {
  ICP_NUMBER: 'footer_icp_number',
  ICP_LINK: 'footer_icp_link',
  ICP_VISIBLE: 'footer_icp_visible',
  MOE_ICP_NUMBER: 'footer_moe_icp_number',
  MOE_ICP_LINK: 'footer_moe_icp_link',
  MOE_ICP_VISIBLE: 'footer_moe_icp_visible',
  AUTHOR: 'footer_author',
} as const

/** 注册控制相关设置 key */
const REG_KEYS = {
  ENABLED: 'registration_enabled',
} as const

/** ---- 注册控制配置子组件 ---- */
function RegistrationControlCard() {
  const [regForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  /** 从后端加载注册控制设置 */
  const loadRegSettings = useCallback(async () => {
    setLoading(true)
    try {
      const map = await getSettingsByKeys([REG_KEYS.ENABLED])
      const raw = map[REG_KEYS.ENABLED]
      const val = raw?.value
      // 兼容 boolean / string / nested object
      let enabled = false
      if (val === true || val === 'true') enabled = true
      else if (val && typeof val === 'object' && 'value' in val) {
        const inner = (val as any).value
        enabled = inner === true || inner === 'true'
      }
      regForm.setFieldsValue({ registrationEnabled: enabled })
    } catch {
      // 忽略
    } finally {
      setLoading(false)
    }
  }, [regForm])

  useEffect(() => { loadRegSettings() }, [loadRegSettings])

  /** 保存注册控制设置 */
  const handleSave = async () => {
    const vals = regForm.getFieldsValue()
    setSaving(true)
    try {
      await saveSettings({
        [REG_KEYS.ENABLED]: {
          value: String(vals.registrationEnabled ?? false),
          desc: vals.registrationEnabled
            ? '注册功能已开放'
            : '当前为个人博客空间，暂不开放注册。如有需要请联系站长。',
        },
      })
      message.success('注册控制配置已保存')
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card
      title={
        <Space>
          <span>🔐</span>
          <span>注册控制</span>
        </Space>
      }
      size="small"
      loading={loading}
      style={{ marginBottom: 16 }}
    >
      <Form form={regForm} layout="vertical">
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12}>
            <Form.Item
              name="registrationEnabled"
              label="是否开放注册"
              valuePropName="checked"
              extra="关闭后，前端注册入口将显示「注册通道已关闭」提示，邮箱验证码也无法发送。"
            >
              <Switch
                checkedChildren="开放"
                unCheckedChildren="关闭"
              />
            </Form.Item>
          </Col>
        </Row>
        <Space>
          <Button type="primary" loading={saving} onClick={handleSave}>
            保存注册配置
          </Button>
          <Button onClick={loadRegSettings}>重置</Button>
        </Space>
      </Form>
    </Card>
  )
}

/** 游客模式控制相关设置 key */
const GUEST_KEYS = {
  ENABLED: 'guest_admin_view_enabled',
} as const

/** ---- 游客模式控制配置子组件 ---- */
function GuestModeControlCard() {
  const [guestForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  /** 从后端加载游客模式设置 */
  const loadGuestSettings = useCallback(async () => {
    setLoading(true)
    try {
      const map = await getSettingsByKeys([GUEST_KEYS.ENABLED])
      const raw = map[GUEST_KEYS.ENABLED]
      const val = raw?.value
      let enabled = false
      if (val === true || val === 'true') enabled = true
      else if (val && typeof val === 'object' && 'value' in val) {
        const inner = (val as any).value
        enabled = inner === true || inner === 'true'
      }
      guestForm.setFieldsValue({ guestEnabled: enabled })
    } catch {
      // 忽略
    } finally {
      setLoading(false)
    }
  }, [guestForm])

  useEffect(() => { loadGuestSettings() }, [loadGuestSettings])

  /** 保存游客模式设置 */
  const handleSave = async () => {
    const vals = guestForm.getFieldsValue()
    setSaving(true)
    try {
      await saveSettings({
        [GUEST_KEYS.ENABLED]: {
          value: String(vals.guestEnabled ?? false),
          desc: vals.guestEnabled
            ? '游客可查看后台（只读模式）'
            : '游客查看后台已关闭',
        },
      })
      message.success('游客模式配置已保存')
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card
      title={
        <Space>
          <span>👁️</span>
          <span>游客查看后台</span>
        </Space>
      }
      size="small"
      loading={loading}
      style={{ marginBottom: 16 }}
    >
      <Form form={guestForm} layout="vertical">
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12}>
            <Form.Item
              name="guestEnabled"
              label="是否允许游客查看后台"
              valuePropName="checked"
              extra="开启后，前端博客页面会显示「查看后台」入口按钮，游客以只读模式浏览后台，无法进行编辑、删除、导出等操作。"
            >
              <Switch
                checkedChildren="开放"
                unCheckedChildren="关闭"
              />
            </Form.Item>
          </Col>
        </Row>
        <Space>
          <Button type="primary" loading={saving} onClick={handleSave}>
            保存游客配置
          </Button>
          <Button onClick={loadGuestSettings}>重置</Button>
        </Space>
      </Form>
    </Card>
  )
}

/** ---- Footer 配置子组件 ---- */
function FooterConfigCard() {
  const [footerForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  /** 从后端加载 footer 设置 */
  const loadFooterSettings = useCallback(async () => {
    setLoading(true)
    try {
      const map = await getSettingsByKeys(Object.values(FOOTER_KEYS))
      const toStr = (v: unknown, fb: string) => {
        if (v == null) return fb
        const raw = typeof v === 'object' && v !== null && 'value' in v ? (v as any).value : v
        return String(raw ?? fb)
      }
      const toBool = (v: unknown, fb: boolean) => {
        if (v == null) return fb
        const raw = typeof v === 'object' && v !== null && 'value' in v ? (v as any).value : v
        if (typeof raw === 'boolean') return raw
        return String(raw) === 'true'
      }
      footerForm.setFieldsValue({
        icpNumber: toStr(map[FOOTER_KEYS.ICP_NUMBER], ''),
        icpLink: toStr(map[FOOTER_KEYS.ICP_LINK], 'https://beian.miit.gov.cn/'),
        icpVisible: toBool(map[FOOTER_KEYS.ICP_VISIBLE], true),
        moeIcpNumber: toStr(map[FOOTER_KEYS.MOE_ICP_NUMBER], ''),
        moeIcpLink: toStr(map[FOOTER_KEYS.MOE_ICP_LINK], 'https://icp.gov.moe/'),
        moeIcpVisible: toBool(map[FOOTER_KEYS.MOE_ICP_VISIBLE], true),
        author: toStr(map[FOOTER_KEYS.AUTHOR], ''),
      })
    } catch {
      // 忽略
    } finally {
      setLoading(false)
    }
  }, [footerForm])

  useEffect(() => { loadFooterSettings() }, [loadFooterSettings])

  /** 保存 footer 设置 */
  const handleSaveFooter = async () => {
    const vals = footerForm.getFieldsValue()
    setSaving(true)
    try {
      await saveSettings({
        [FOOTER_KEYS.ICP_NUMBER]: { value: vals.icpNumber || '', desc: '备案号文字' },
        [FOOTER_KEYS.ICP_LINK]: { value: vals.icpLink || '', desc: '备案号链接' },
        [FOOTER_KEYS.ICP_VISIBLE]: { value: String(vals.icpVisible ?? true), desc: '备案号是否显示' },
        [FOOTER_KEYS.MOE_ICP_NUMBER]: { value: vals.moeIcpNumber || '', desc: '萌ICP文字' },
        [FOOTER_KEYS.MOE_ICP_LINK]: { value: vals.moeIcpLink || '', desc: '萌ICP链接' },
        [FOOTER_KEYS.MOE_ICP_VISIBLE]: { value: String(vals.moeIcpVisible ?? true), desc: '萌ICP是否显示' },
        [FOOTER_KEYS.AUTHOR]: { value: vals.author || '', desc: 'Footer作者名称' },
      })
      message.success('Footer 配置已保存')
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="Footer 配置" size="small" loading={loading} style={{ marginBottom: 16 }}>
      <Form form={footerForm} layout="vertical" initialValues={{ icpVisible: true, moeIcpVisible: true }}>
        <Row gutter={16}>
          {/* 作者 */}
          <Col xs={24} sm={8}>
            <Form.Item name="author" label="作者名称">
              <Input placeholder="如：Eric Hu" />
            </Form.Item>
          </Col>
        </Row>
        <Divider style={{ margin: '8px 0 16px' }}>备案号（ICP）</Divider>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="icpNumber" label="备案号文字">
              <Input placeholder="如：粤ICP备2025000000号" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="icpLink" label="备案号链接">
              <Input placeholder="https://beian.miit.gov.cn/" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="icpVisible" label="是否显示" valuePropName="checked">
              <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
            </Form.Item>
          </Col>
        </Row>
        <Divider style={{ margin: '8px 0 16px' }}>萌ICP</Divider>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="moeIcpNumber" label="萌ICP文字">
              <Input placeholder="如：萌ICP备20261027号" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="moeIcpLink" label="萌ICP链接">
              <Input placeholder="https://icp.gov.moe/?keyword=20261027" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="moeIcpVisible" label="是否显示" valuePropName="checked">
              <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
            </Form.Item>
          </Col>
        </Row>
        <Space>
          <Button type="primary" loading={saving} onClick={handleSaveFooter}>
            保存 Footer 配置
          </Button>
          <Button onClick={loadFooterSettings}>重置</Button>
        </Space>
      </Form>
    </Card>
  )
}

export default function SettingsPage() {
  const { data: list = [], isLoading } = useSettings()
  const { update } = useSettingMutations()
  const { isGuest } = useGuestMode()
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
    ...(!isGuest ? [{
      title: '操作',
      key: 'action',
      width: 80,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_: unknown, record: SettingItem) => (
        <Button type="link" size="small" onClick={() => handleEdit(record)}>
          编辑
        </Button>
      ),
    }] : []),
  ]

  const { containerRef, scrollY } = useTableScrollY({ hasPagination: false })

  return (
    <div className="admin-content">
      <h1>设置</h1>

      {/* 注册控制配置区（游客不可见） */}
      {!isGuest && <RegistrationControlCard />}

      {/* 游客查看后台控制（游客不可见） */}
      {!isGuest && <GuestModeControlCard />}

      {/* Footer 专属配置区（游客不可见） */}
      {!isGuest && <FooterConfigCard />}

      {/* 全部设置列表 */}
      <div className="admin-content__table-wrap">
        <div ref={containerRef} className="admin-content__table-body">
          <div className="admin-content__toolbar">
            <WriteAction>
              <Button icon={<DownloadOutlined />} onClick={() => exportToJSON(list, 'settings')}>导出</Button>
            </WriteAction>
          </div>
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
