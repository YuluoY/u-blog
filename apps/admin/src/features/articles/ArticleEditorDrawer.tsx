import { useEffect, useState, useCallback, useRef } from 'react'
import { Button, Drawer, Form, Input, Select, Space, Switch, Upload, message } from 'antd'
import { DeleteOutlined, LinkOutlined, CloudUploadOutlined, EditOutlined } from '@ant-design/icons'
import MDEditor from '@uiw/react-md-editor'
import { useTheme } from '../../contexts/ThemeContext'
import { uploadFile } from '../../shared/api/upload'
import { useTags } from '../tags/useTags'
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

/** 封面图表单控件：单图模式，有图时 hover 显示替换/删除遮罩 */
function CoverField({ value, onChange }: { value?: string; onChange?: (v: string) => void }) {
  const [uploading, setUploading] = useState(false)
  /** URL 输入模式 */
  const [urlMode, setUrlMode] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /** 处理文件上传 */
  const handleFile = useCallback(async (file: File) => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) { message.error('仅支持图片文件'); return }
    if (file.size > 5 * 1024 * 1024) { message.error('图片不能超过 5 MB'); return }
    try {
      setUploading(true)
      const result = await uploadFile(file)
      onChange?.(result.url)
    } catch {
      message.error('封面上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }, [onChange])

  /** 点击替换按钮 → 触发隐藏的 file input */
  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  /** 清除封面 */
  const handleRemove = useCallback(() => {
    onChange?.('')
    setUrlMode(false)
  }, [onChange])

  // 有封面时：展示图片 + hover 遮罩
  if (value && !urlMode) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div
          className="cover-field-preview"
          style={{
            position: 'relative',
            width: 320,
            height: 180,
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid #d9d9d9',
          }}
        >
          <img
            src={value}
            alt="封面"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          {/* hover 遮罩 */}
          <div
            className="cover-field-overlay"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              opacity: 0,
              transition: 'opacity .2s',
            }}
          >
            <Button
              type="primary"
              ghost
              icon={<EditOutlined />}
              size="small"
              onClick={triggerFileSelect}
              loading={uploading}
            >
              替换
            </Button>
            <Button
              danger
              ghost
              icon={<DeleteOutlined />}
              size="small"
              onClick={handleRemove}
            >
              删除
            </Button>
          </div>
        </div>
        {/* 隐藏的文件选择器 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
            e.target.value = '' // 允许重复选择同一文件
          }}
        />
        <style>{`
          .cover-field-preview:hover .cover-field-overlay { opacity: 1 !important; }
        `}</style>
      </div>
    )
  }

  // 无封面时：上传区 + 链接输入切换
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {urlMode ? (
        <>
          <Input
            placeholder="https://example.com/cover.jpg"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            allowClear
            onPressEnter={() => { if (value) setUrlMode(false) }}
          />
          <Button size="small" icon={<CloudUploadOutlined />} onClick={() => setUrlMode(false)}>
            切换为上传
          </Button>
        </>
      ) : (
        <>
          <Upload.Dragger
            accept="image/jpeg,image/png,image/webp,image/gif"
            showUploadList={false}
            beforeUpload={(file) => { handleFile(file); return false }}
            disabled={uploading}
            style={{ padding: '12px 0' }}
          >
            <p style={{ marginBottom: 4 }}>
              <CloudUploadOutlined style={{ fontSize: 24, color: '#999' }} />
            </p>
            <p style={{ color: '#666', fontSize: 13, margin: 0 }}>
              {uploading ? '上传中...' : '点击或拖拽图片到此处上传'}
            </p>
            <p style={{ color: '#aaa', fontSize: 12, margin: '4px 0 0' }}>
              支持 JPG / PNG / WebP / GIF，不超过 5 MB
            </p>
          </Upload.Dragger>
          <Button size="small" icon={<LinkOutlined />} onClick={() => setUrlMode(true)}>
            输入链接
          </Button>
        </>
      )}
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
  /** 标签 ID 数组 */
  tags?: number[]
  isTop: boolean
  isPrivate: boolean
  isOriginal: boolean
  /** 密码保护（留空则不设密码） */
  protect?: string
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
  const { data: allTags = [] } = useTags()

  useEffect(() => {
    if (open && article) {
      form.setFieldsValue({
        title: article.title,
        desc: article.desc ?? '',
        content: article.content ?? '',
        cover: article.cover ?? '',
        status: article.status,
        categoryId: article.categoryId ?? undefined,
        tags: article.tags?.map((t) => t.id) ?? [],
        isTop: article.isTop,
        isPrivate: article.isPrivate,
        isOriginal: article.isOriginal ?? true,
        protect: article.protect ?? '',
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
        <Form.Item name="cover" label="封面图">
          <CoverField />
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
        <Form.Item name="tags" label="标签">
          <Select
            mode="multiple"
            allowClear
            placeholder="选择标签"
            options={allTags.map((t) => ({ value: t.id, label: t.name }))}
            optionFilterProp="label"
          />
        </Form.Item>
        <Form.Item name="isTop" label="置顶" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="isPrivate" label="私密" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="isOriginal" label="原创" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="protect" label="密码保护" extra="设置后读者需输入密码才能查看正文；留空则取消密码保护">
          <Input.Password placeholder="留空则不设密码" allowClear autoComplete="new-password" />
        </Form.Item>
        <Form.Item name="publishedAt" label="发布时间">
          <Input type="datetime-local" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
