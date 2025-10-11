import type { Meta } from '@storybook/vue3'
import { UTag } from 'ucc-ui'
import 'ucc-ui/dist/index.css'
import type { Story } from './types'
import { container } from './utils'

const meta: Meta<typeof UTag> = {
  title: 'Components/Tag',
  component: UTag,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'danger', 'info'],
      description: '标签类型'
    },
    closable: {
      control: 'boolean',
      description: '是否可关闭'
    },
    size: {
      control: 'select',
      options: ['large', 'default', 'small'],
      description: '标签大小'
    },
    effect: {
      control: 'select',
      options: ['dark', 'light', 'plain'],
      description: '标签主题'
    },
    round: {
      control: 'boolean',
      description: '是否圆角'
    },
    color: {
      control: 'color',
      description: '自定义颜色'
    },
    content: {
      control: 'text',
      description: '标签内容'
    }
  }
}

export const Default: Story<typeof UTag> = {
  args: {
    type: 'primary',
    closable: true,
    size: 'default',
    effect: 'light',
    round: false,
    color: '',
    content: '标签内容'
  },
  argTypes: meta.argTypes,
  render: args => ({
    components: { UTag },
    setup()
    {
      const handleClose = (event: MouseEvent) =>
      {
        console.log('Tag closed', event)
      }
      return { args, handleClose }
    },
    template: container(`
      <UTag v-bind="args" @close="handleClose">
        {{ args.content }}
      </UTag>
    `)
  })
}

export default meta