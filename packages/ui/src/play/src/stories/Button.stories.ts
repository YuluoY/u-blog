import type { Meta } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'

import { UButton, UIcon } from 'ucc-ui'
import 'ucc-ui/dist/index.css'
import type { UButtonProps } from '../../../components/button/types'
import { CIconPosition, CButtonSize, CButtonType } from '../../../components/button/types/const'
import type { ExtraContent, StoryPlus } from './types'
import { container } from './utils'


const meta: Meta<typeof UButton> = {
  title: 'Components/Button',
  component: UButton,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: Object.values(CButtonType),
      description: '按钮类型'
    },
    size: {
      control: 'select',
      options: Object.values(CButtonSize),
      description: '按钮大小'
    },
    icon: {
      control: 'text',
      description: '按钮图标'
    },
    iconStyle: {
      control: 'object',
      description: '图标样式'
    },
    iconPosition: {
      control: 'select',
      options: Object.values(CIconPosition),
      description: '图标位置'
    },
    color: {
      control: 'color',
      description: '按钮颜色'
    },
    autofocus: {
      control: 'boolean',
      description: '是否自动获得焦点'
    },
    circle: {
      control: 'boolean',
      description: '是否为圆形按钮'
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用按钮'
    },
    round: {
      control: 'boolean',
      description: '是否为圆角按钮'
    },
    plain: {
      control: 'boolean',
      description: '是否为朴素按钮'
    },
    loading: {
      control: 'boolean',
      description: '是否为加载状态'
    },
    nativeType: {
      control: 'text',
      description: '原生按钮类型'
    },
    useDebounce: {
      control: 'boolean',
      description: '是否使用防抖'
    },
    debounceTime: {
      control: 'number',
      description: '防抖时间(ms)'
    },
    useThrottle: {
      control: 'boolean',
      description: '是否使用节流'
    },
    throttleTime: {
      control: 'number',
      description: '节流时间(ms)'
    },
    tag: {
      control: 'text',
      description: '自定义渲染的 HTML 标签'
    },
  },
  args: {
    onClick: fn(),
  }
}

export const Default: StoryPlus<typeof UButton> = {
  argTypes: {
    content: {
      control: { type: 'text' }
    }
  },
  args: {
    content: '按钮组件',
    nativeType: 'button',
    tag: 'button',
    type: 'primary',
    size: 'default',
    icon: 'phone',
    iconPosition: 'default',
    iconStyle: {},
    circle: false,
    disabled: false,
    round: false,
    plain: false,
    loading: false,
    autofocus: false,
    useThrottle: false,
    useDebounce: false,
    throttleTime: 400,
    debounceTime: 400,
    color: '#705353',
  },
  render: (args: UButtonProps & ExtraContent) => ({
    components: { UButton, UIcon },
    setup()
    {
      return { args }
    },
    template: container(`
      <UButton v-bind="args">
        <UIcon :icon="args.icon" :style="args.iconStyle" v-if="${args.iconPosition === CIconPosition.LEFT}" />
        ${args.content}
        <UIcon :icon="args.icon" :style="args.iconStyle" v-if="${args.iconPosition === CIconPosition.RIGHT}" />
      </UButton>
    `),
  }),

  play: async({canvasElement, args, step}) =>
  {
    const canvas = within(canvasElement)
    await step('Click the button', async() =>
    {
      await userEvent.click(canvas.getByRole('button'))
    })

    expect(args.onClick).toHaveBeenCalled()
  }
}

export default meta