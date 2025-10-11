import type { Meta } from '@storybook/vue3'

import { UIcon } from 'ucc-ui'
import 'ucc-ui/dist/index.css'
import type { Story } from './types'
import { container } from './utils'
import type { UIconProps } from '../../../components/icon/types'
import { CIconFlip, CIconPull, CIconRotation, CIconSize, CIconType } from '../../../components/icon/types/const'


const meta: Meta<typeof UIcon> = {
 title: 'Components/Icon',
 component: UIcon,
 tags: ['autodocs']
}
export const Default: Story<typeof UIcon> = {
  argTypes: {
    pulse: {
      control: 'boolean',
      description: '是否脉动的方式旋转',
    },
    spin: {
      control: 'boolean',
      description: '是否旋转',
    },
    flip: {
      control: 'select',
      description: '图标翻转',
      options: CIconFlip
    },
    size: {
      control: 'select',
      description: '图标大小',
      options: CIconSize
    },
    type: {
      control: 'select',
      description: '图标类型',
      options: CIconType
    },
    pull: {
      control: 'select',
      description: '图标位置<br>有多余宽时生效',
      options: CIconPull
    },
    rotation:{
      control: 'select',
      description: '图标旋转角度',
      options: CIconRotation
    },
    color: {
      control: 'color',
      description: '图标颜色',
    },
    border: {
      control: 'boolean',
      description: '是否显示边框',
    },
    symbol: {
      control: 'boolean',
      description: '是否显示为符号',
    },
    fixedWidth: {
      control: 'boolean',
      description: '是否固定宽度',
    },
    spinPulse: {
      control: 'boolean',
      description: '是否脉冲旋转',
    },
    spinReverse: {
      control: 'boolean',
      description: '是否反向旋转<br>spin为true时生效',
    },
    bounce: {
      control: 'boolean',
      description: '是否弹跳',
    },
    shake: {
      control: 'boolean',
      description: '是否抖动',
    },
    inverse: {
      control: 'boolean',
      description: '是否反色',
    },
    fade: {
      control: 'boolean',
      description: '是否淡出',
    },
    beatFade: {
      control: 'boolean',
      description: '是否脉冲淡出',
    },
    icon: {
      control: 'text',
      description: '图标名称',
    }
  },
  args: {
    type: 'default',
    icon: 'phone',
    pull: 'left',
    size: "sm",
    flip: 'default',
    rotation: 'default',
    color: '',
    border: false,
    symbol: false,
    fixedWidth: false,
    spin: false,
    spinPulse: false,
    spinReverse: false,
    pulse: false,
    bounce: false,
    shake: false,
    inverse: false,
    fade: false,
    beatFade: false,
  },
  render: (args: UIconProps) => ({
    components: { UIcon },
    setup() {
      return { args }
    },
    template: container(`
      <u-icon v-bind="args" />
    `),
  })
}

export default meta