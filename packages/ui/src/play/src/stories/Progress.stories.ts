import type { Meta } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import { UProgress } from 'ucc-ui'
import 'ucc-ui/dist/index.css'
import type { UProgressProps } from '../../../components/progress/types'
import type { Story } from './types'
import { container } from './utils'

const meta: Meta<typeof UProgress> = {
  title: 'Components/Progress',
  component: UProgress,
  tags: ['autodocs'],
  argTypes: {
    percentage: {
      control: { type: 'number', min: 0, max: 100 },
      description: '百分比'
    },
    type: {
      control: 'select',
      options: ['line', 'circle', 'dashboard'],
      description: '进度条类型'
    },
    strokeWidth: {
      control: 'number',
      description: '进度条的宽度'
    },
    textInside: {
      control: 'boolean',
      description: '进度条显示文字内置在进度条内（只在 type=line 时可用）'
    },
    status: {
      control: 'select',
      options: ['success', 'exception', 'warning'],
      description: '进度条当前状态'
    },
    color: {
      control: 'color',
      description: '进度条背景色'
    },
    width: {
      control: 'number',
      description: '环形进度条画布宽度（只在 type 为 circle 或 dashboard 时可用）'
    },
    showText: {
      control: 'boolean',
      description: '是否显示进度条文字内容'
    },
    strokeLinecap: {
      control: 'select',
      options: ['butt', 'round', 'square'],
      description: '进度条的���状'
    },
    format: {
      control: 'function',
      description: '指定进度条文字内容'
    },
    content: {
      control: 'text',
      description: '进度条内容'
    }
  }
}

export const Default: Story<typeof UProgress> = {
  args: {
    percentage: 50,
    type: 'line',
    strokeWidth: 6,
    textInside: false,
    status: undefined,
    color: '',
    width: 126,
    showText: true,
    strokeLinecap: 'round',
    content: '进度条内容'
  },
  argTypes: meta.argTypes,
  render: (args) => ({
    components: { UProgress },
    setup() {
      const format = (percentage: number) => {
        return percentage === 100 ? '完成' : `${percentage}%`
      }
      return { args, format }
    },
    template: container(`
      <div style="width: 350px;">
        <p>{{ args.content }}</p>
        <UProgress v-bind="args" :format="format" />
      </div>
    `)
  })
}

export const Circle: Story<typeof UProgress> = {
  args: {
    percentage: 75,
    type: 'circle',
    strokeWidth: 6,
    status: 'success',
    width: 126,
    showText: true,
    strokeLinecap: 'round',
    content: '圆形进度条内容'
  },
  argTypes: meta.argTypes,
  render: (args) => ({
    components: { UProgress },
    setup() {
      const format = (percentage: number) => {
        return percentage === 100 ? '完成' : `${percentage}%`
      }
      return { args, format }
    },
    template: container(`
      <div>
        <p>{{ args.content }}</p>
        <UProgress v-bind="args" :format="format" />
      </div>
    `)
  })
}

export const Dashboard: Story<typeof UProgress> = {
  args: {
    percentage: 80,
    type: 'dashboard',
    strokeWidth: 6,
    status: undefined,
    width: 126,
    showText: true,
    strokeLinecap: 'round',
    content: '仪表盘进度条内容'
  },
  argTypes: meta.argTypes,
  render: (args) => ({
    components: { UProgress },
    setup() {
      const format = (percentage: number) => {
        return percentage === 100 ? '完成' : `${percentage}%`
      }
      return { args, format }
    },
    template: container(`
      <div>
        <p>{{ args.content }}</p>
        <UProgress v-bind="args" :format="format" />
      </div>
    `)
  })
}

export default meta 