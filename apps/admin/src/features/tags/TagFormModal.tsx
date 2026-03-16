import { useEffect, useState, useCallback } from 'react'
import { Modal, Form, Input, Popover, Button, Space } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import GradientColorPicker from 'react-best-gradient-color-picker'
import type { TagItem } from './api'

/* ---- 随机颜色生成工具 ---- */

/** 生成随机 HSL 纯色（饱和度 55-85%、亮度 45-65%，保证鲜艳且可读） */
function randomSolidColor(): string {
  const h = Math.floor(Math.random() * 360)
  const s = 55 + Math.floor(Math.random() * 31)
  const l = 45 + Math.floor(Math.random() * 21)
  return `hsl(${h}, ${s}%, ${l}%)`
}

/** 生成随机线性渐变色（两个色相差 ≥ 60°，避免渐变过渡太平淡） */
function randomGradientColor(): string {
  const h1 = Math.floor(Math.random() * 360)
  const offset = 60 + Math.floor(Math.random() * 241) // 60~300
  const h2 = (h1 + offset) % 360
  const angle = Math.floor(Math.random() * 360)
  const s1 = 60 + Math.floor(Math.random() * 26)
  const l1 = 45 + Math.floor(Math.random() * 21)
  const s2 = 60 + Math.floor(Math.random() * 26)
  const l2 = 45 + Math.floor(Math.random() * 21)
  return `linear-gradient(${angle}deg, hsl(${h1}, ${s1}%, ${l1}%) 0%, hsl(${h2}, ${s2}%, ${l2}%) 100%)`
}

type ColorMode = 'solid' | 'gradient'

/** 根据模式生成随机颜色，排除已存在的颜色（最多重试 20 次） */
function generateUniqueColor(mode: ColorMode, existingColors: string[]): string {
  const gen = mode === 'solid' ? randomSolidColor : randomGradientColor
  const existing = new Set(existingColors.map((c) => c.toLowerCase()))
  for (let i = 0; i < 20; i++) {
    const color = gen()
    if (!existing.has(color.toLowerCase())) return color
  }
  return gen()
}

/* ---- 颜色选择器组件 ---- */

function ColorPickerFormField({
  value,
  onChange,
  existingColors,
}: {
  value?: string
  onChange?: (v: string) => void
  existingColors: string[]
}) {
  const colorValue = value || '#1890ff'

  // 判断当前颜色模式
  const isGradient = colorValue.includes('gradient')
  const [mode, setMode] = useState<ColorMode>(isGradient ? 'gradient' : 'solid')

  const handleRandomize = useCallback(() => {
    const color = generateUniqueColor(mode, existingColors)
    onChange?.(color)
  }, [mode, existingColors, onChange])

  const toggleMode = useCallback(() => {
    const nextMode: ColorMode = mode === 'solid' ? 'gradient' : 'solid'
    setMode(nextMode)
    const color = generateUniqueColor(nextMode, existingColors)
    onChange?.(color)
  }, [mode, existingColors, onChange])

  return (
    <Space align="center">
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
      <Button
        size="small"
        icon={<ReloadOutlined />}
        onClick={handleRandomize}
        title="换一个随机颜色"
      >
        随机
      </Button>
      <Button
        size="small"
        onClick={toggleMode}
        title={mode === 'solid' ? '切换为渐变色' : '切换为纯色'}
      >
        {mode === 'solid' ? '渐变' : '纯色'}
      </Button>
    </Space>
  )
}

/* ---- 表单弹窗 ---- */

interface TagFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: { name: string; desc?: string; color?: string }) => void | Promise<void>
  loading?: boolean
  initial?: TagItem | null
  /** 当前已有的 tag 颜色列表，用于去重 */
  existingColors?: string[]
}

export function TagFormModal({
  open,
  onClose,
  onSubmit,
  loading,
  initial,
  existingColors = [],
}: TagFormModalProps) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      const initialColor = initial?.color
        ?? generateUniqueColor('solid', existingColors)
      form.setFieldsValue({
        name: initial?.name ?? '',
        desc: initial?.desc ?? '',
        color: initialColor,
      })
    }
  }, [open, initial, form, existingColors])

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
          <ColorPickerFormField existingColors={existingColors} />
        </Form.Item>
        <Form.Item name="desc" label="描述" rules={[{ max: 255 }]}>
          <Input.TextArea placeholder="标签描述" maxLength={255} rows={3} showCount />
        </Form.Item>
      </Form>
    </Modal>
  )
}
