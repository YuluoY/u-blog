import type { Meta } from '@storybook/vue3'
import { UBadge } from 'ucc-ui'
import 'ucc-ui/dist/index.css'
import type { ExtraContent, StoryPlus } from './types'
import { container } from './utils'

const meta: Meta<typeof UBadge & ExtraContent> = {
  title: 'Components/Badge',
  component: UBadge,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: '显示值'
    },
    max: {
      control: 'number',
      description: '最大值，超过最大值会显示{max}+。只有当value是数字类型时起作用'
    },
    isDot: {
      control: 'boolean',
      description: '是否显示小圆点'
    },
    hidden: {
      control: 'boolean',
      description: '是否隐藏Badge'
    },
    type: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'danger', 'info'],
      description: 'badge类型'
    },
    showZero: {
      control: 'boolean',
      description: '值为0的时候是否显示badge'
    },
    color: {
      control: 'color',
      description: '背景色'
    },
    offset: {
      control: 'object',
      description: 'badge的偏移量'
    },
    badgeStyle: {
      control: 'object',
      description: '自定义badge样式'
    },
    badgeClass: {
      control: 'text',
      description: '自定义badge类名'
    },
    content: {
      control: 'text',
      description: '徽标内容'
    }
  }
}

export const Default: StoryPlus<typeof UBadge> = {
  args: {
    value: 5,
    max: 99,
    isDot: false,
    hidden: false,
    type: 'danger',
    showZero: true,
    color: '',
    offset: [0, 0],
    badgeStyle: {},
    badgeClass: '',
    content: '徽标内容'
  },
  argTypes: {
    value: { control: 'text' },
    max: { control: 'number' },
    isDot: { control: 'boolean' },
    hidden: { control: 'boolean' },
    type: { control: 'select', options: ['primary', 'success', 'warning', 'danger', 'info'] },
    showZero: { control: 'boolean' },
    color: { control: 'color' },
    offset: { control: 'object' },
    badgeStyle: { control: 'object' },
    badgeClass: { control: 'text' },
    content: { control: 'text' }
  },
  render: args => ({
    components: { UBadge },
    setup()
    {
      return { args }
    },
    template: container(`
      <UBadge v-bind="args">
        <div style="width: 40px; height: 40px; background: #f0f0f0; display: flex; align-items: center; justify-content: center;">
          {{ args.content }}
        </div>
      </UBadge>
    `)
  })
}

export default meta