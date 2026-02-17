import { useEffect } from 'react'
import { Button, Drawer, Form, Input, Select, Space, Switch } from 'antd'
import MDEditor from '@uiw/react-md-editor'
import { useTheme } from '../../contexts/ThemeContext'
import type { ArticleItem } from './api'
import type { CategoryItem } from '../categories/api'

import '@uiw/react-md-editor/markdown-editor.css'

/** 与 Form 联动的 Markdown 编辑器，与前端文章展示一致使用 live 预览，随主题亮/暗 */
function MDEditorFormField({
  value,
  onChange,
}: {
  value?: string
  onChange?: (v: string) => void
}) {
  const { themeMode } = useTheme()
  return (
    <div data-color-mode={themeMode} className="admin-article-editor">
      <MDEditor
        height={360}
        value={value ?? ''}
        onChange={(v) => onChange?.(v ?? '')}
        preview="live"
        visibleDragbar={false}
      />
    </div>
  )
}

const STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '已发布' },
  { value: 'deleted', label: '已删除' },
]

export interface ArticleEditorDrawerProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: ArticleFormValues) => void | Promise<void>
  loading?: boolean
  article: ArticleItem | null
  categories: CategoryItem[]
}

export interface ArticleFormValues {
  title: string
  desc?: string
  content: string
  cover?: string
  status: string
  categoryId?: number | null
  isTop: boolean
  isPrivate: boolean
  publishedAt?: string
}

export function ArticleEditorDrawer({
  open,
  onClose,
  onSubmit,
  loading,
  article,
  categories,
}: ArticleEditorDrawerProps) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open && article) {
      form.setFieldsValue({
        title: article.title,
        desc: article.desc ?? '',
        content: article.content ?? '',
        cover: article.cover ?? '',
        status: article.status,
        categoryId: article.categoryId ?? undefined,
        isTop: article.isTop,
        isPrivate: article.isPrivate,
        publishedAt: article.publishedAt?.slice(0, 16) ?? '',
      })
    }
  }, [open, article, form])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    await Promise.resolve(
      onSubmit({
        ...values,
        publishedAt: values.publishedAt ? new Date(values.publishedAt).toISOString() : undefined,
      })
    )
    onClose()
  }

  return (
    <Drawer
      title={article ? `编辑文章：${article.title?.slice(0, 30) ?? ''}${(article.title?.length ?? 0) > 30 ? '…' : ''}` : '编辑文章'}
      open={open}
      onClose={onClose}
      size={960}
      destroyOnHidden
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            保存
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item name="title" label="标题" rules={[{ required: true }, { max: 100 }]}>
          <Input maxLength={100} showCount placeholder="文章标题" />
        </Form.Item>
        <Form.Item name="desc" label="描述">
          <Input.TextArea rows={2} maxLength={255} placeholder="摘要/描述" />
        </Form.Item>
        <Form.Item name="content" label="正文（Markdown）" rules={[{ required: true, message: '请输入正文' }]}>
          <MDEditorFormField />
        </Form.Item>
        <Form.Item name="cover" label="封面图 URL">
          <Input placeholder="https://..." />
        </Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true }]}>
          <Select options={STATUS_OPTIONS} />
        </Form.Item>
        <Form.Item name="categoryId" label="分类">
          <Select
            allowClear
            placeholder="选择分类"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
        </Form.Item>
        <Form.Item name="isTop" label="置顶" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="isPrivate" label="私密" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="publishedAt" label="发布时间">
          <Input type="datetime-local" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
