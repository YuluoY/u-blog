import { useEffect, useState } from 'react'
import { Modal, Form, Input, InputNumber, Select, Tabs } from 'antd'
import MDEditor from '@uiw/react-md-editor'
import { useTheme } from '../../contexts/ThemeContext'
import { CPageBlockType } from '@u-blog/model'
import type { AboutBlockItem } from './api'

import '@uiw/react-md-editor/markdown-editor.css'

/** 区块类型选项（用于关于页） */
const PAGE_BLOCK_TYPE_OPTIONS = [
  { value: CPageBlockType.INTRO, label: '简介 (intro)' },
  { value: CPageBlockType.WHOAMI, label: '我是谁 (whoami)' },
  { value: CPageBlockType.EXPERIENCE, label: '经历 (experience)' },
  { value: CPageBlockType.WHY_BLOG, label: '为何写博客 (why_blog)' },
  { value: CPageBlockType.TIMELINE, label: '时间线 (timeline)' },
  { value: CPageBlockType.SKILLS, label: '技术栈与熟练度 (skills)' },
  { value: CPageBlockType.CUSTOM, label: '自定义 (custom)' },
]

interface AboutBlockFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: {
    page: string
    sortOrder: number
    type: string
    title?: string
    content: string
    extra?: Record<string, unknown>
  }) => void | Promise<void>
  loading?: boolean
  initial?: AboutBlockItem | null
}

/** 随主题亮/暗的 Markdown 编辑器 */
function MDEditorFormField({
  value,
  onChange,
}: {
  value?: string
  onChange?: (v: string) => void
}) {
  const { themeMode } = useTheme()
  return (
    <div data-color-mode={themeMode}>
      <MDEditor
        height={280}
        value={value ?? ''}
        onChange={(v) => onChange?.(v ?? '')}
        preview="live"
        visibleDragbar={false}
      />
    </div>
  )
}

export function AboutBlockFormModal({
  open,
  onClose,
  onSubmit,
  loading,
  initial,
}: AboutBlockFormModalProps) {
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')

  useEffect(() => {
    if (open) {
      const extra = initial?.extra
      form.setFieldsValue({
        page: initial?.page ?? 'about',
        sortOrder: initial?.sortOrder ?? 0,
        type: initial?.type ?? CPageBlockType.INTRO,
        title: initial?.title ?? '',
        content: initial?.content ?? '',
        extraJson: extra != null ? JSON.stringify(extra, null, 2) : '',
      })
      setActiveTab('edit')
    }
  }, [open, initial, form])

  const handleOk = async () => {
    const values = await form.validateFields()
    const { extraJson, ...rest } = values as { extraJson?: string; [k: string]: unknown }
    let extra: Record<string, unknown> | undefined
    if (extraJson && String(extraJson).trim()) {
      try {
        extra = JSON.parse(extraJson) as Record<string, unknown>
      } catch {
        form.setFields([{ name: 'extraJson', errors: ['请输入合法 JSON'] }])
        return
      }
    }
    await Promise.resolve(onSubmit({ ...rest, extra }))
    form.resetFields()
    onClose()
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  const content = Form.useWatch('content', form) ?? ''
  const title = Form.useWatch('title', form) ?? ''

  return (
    <Modal
      title={initial ? '编辑区块' : '新增区块'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      destroyOnHidden={false}
      width={720}
    >
      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as 'edit' | 'preview')}
        size="small"
        items={[
          {
            key: 'edit',
            label: '编辑',
            children: (
              <Form form={form} layout="vertical">
                <Form.Item name="page" label="页面" rules={[{ required: true }, { max: 50 }]}>
                  <Input placeholder="如 about" maxLength={50} />
                </Form.Item>
                <Form.Item name="sortOrder" label="排序" rules={[{ required: true }]}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="type" label="类型" rules={[{ required: true }]}>
                  <Select placeholder="选择区块类型" options={PAGE_BLOCK_TYPE_OPTIONS} allowClear={false} />
                </Form.Item>
                <Form.Item name="title" label="标题" rules={[{ max: 200 }]}>
                  <Input placeholder="区块标题" maxLength={200} />
                </Form.Item>
                <Form.Item name="content" label="内容（Markdown）" rules={[{ required: true }]}>
                  <MDEditorFormField />
                </Form.Item>
                <Form.Item
                  name="extraJson"
                  label="扩展数据 (JSON)"
                  tooltip="时间线类型请填写 { \"items\": [ { \"year\": \"2020\", \"title\": \"标题\", \"desc\": \"描述\" } ] }"
                >
                  <Input.TextArea rows={4} placeholder='{"items": [{"year": "2020", "title": "...", "desc": "..."}]}' />
                </Form.Item>
              </Form>
            ),
          },
          {
            key: 'preview',
            label: '预览',
            children: (
              <>
                {title && <h3>{title}</h3>}
                <MDEditor.Markdown source={content || '*暂无内容*'} />
              </>
            ),
          },
        ]}
      />
    </Modal>
  )
}
