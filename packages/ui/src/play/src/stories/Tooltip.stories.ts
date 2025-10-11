import type { Meta } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import { UTooltip } from 'ucc-ui'
import 'ucc-ui/dist/index.css'
import type { UTooltipProps } from '../../../components/tooltip/types'
import type { Story } from './types'
import { container } from './utils'
import { ref } from 'vue'

const meta: Meta<typeof UTooltip> = {
  title: 'Components/Tooltip',
  component: UTooltip,
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: 'text',
      description: '显示的内容'
    },
    placement: {
      control: 'select',
      options: ['top', 'top-start', 'top-end', 'bottom', 'bottom-start', 'bottom-end', 'left', 'left-start', 'left-end', 'right', 'right-start', 'right-end'],
      description: '提示框位置'
    },
    effect: {
      control: 'select',
      options: ['dark', 'light'],
      description: '主题'
    },
    trigger: {
      control: 'select',
      options: ['hover', 'click', 'focus'],
      description: '触发方式'
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用'
    },
    offset: {
      control: 'number',
      description: '出现位置的偏移量'
    },
    transition: {
      control: 'text',
      description: '过渡动画名称'
    },
    showArrow: {
      control: 'boolean',
      description: '是否显示箭头'
    },
    visible: {
      control: 'boolean',
      description: '是否显示 tooltip'
    }
  }
}

export const Default: Story<typeof UTooltip> = {
  args: {
    content: '这是一个提示文本',
    placement: 'top',
    effect: 'dark',
    trigger: 'hover',
    disabled: false,
    offset: 12,
    transition: 'fade',
    showArrow: true,
    visible: false,
    content: '悬停查看提示'
  },
  argTypes: meta.argTypes,
  render: (args) => ({
    components: { UTooltip },
    setup() {
      const visible = ref(args.visible)
      const handleShow = () => {
        visible.value = true
      }
      const handleHide = () => {
        visible.value = false
      }
      return { args, visible, handleShow, handleHide }
    },
    template: container(`
      <UTooltip 
        v-bind="args"
        v-model:visible="visible"
        @show="handleShow"
        @hide="handleHide"
      >
        <button>{{ args.content }}</button>
      </UTooltip>
    `)
  })
}

export default meta 