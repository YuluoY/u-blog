import type { Meta } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import { USlider } from 'ucc-ui'
import 'ucc-ui/dist/index.css'
import type { USliderProps } from '../../../components/slider/types'
import type { Story } from './types'
import { container } from './utils'
import { ref } from 'vue'

const meta: Meta<typeof USlider> = {
  title: 'Components/Slider',
  component: USlider,
  tags: ['autodocs'],
  argTypes: {
    modelValue: {
      control: 'number',
      description: '滑块的值'
    },
    min: {
      control: 'number',
      description: '最小值'
    },
    max: {
      control: 'number',
      description: '最大值'
    },
    step: {
      control: 'number',
      description: '步长'
    },
    showInput: {
      control: 'boolean',
      description: '是否显示输入框'
    },
    showInputControls: {
      control: 'boolean',
      description: '在显示输入框的情况下，是否显示输入框的控制按钮'
    },
    size: {
      control: 'select',
      options: ['large', 'default', 'small'],
      description: '滑块的尺寸'
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用'
    },
    range: {
      control: 'boolean',
      description: '是否为范围选择'
    },
    vertical: {
      control: 'boolean',
      description: '是否竖向模式'
    },
    height: {
      control: 'text',
      description: 'Slider 高度，竖向模式时必填'
    },
    showStops: {
      control: 'boolean',
      description: '是否显示间断点'
    },
    showTooltip: {
      control: 'boolean',
      description: '是否显示 tooltip'
    },
    formatTooltip: {
      control: 'function',
      description: '格式化 tooltip message'
    },
    content: {
      control: 'text',
      description: '滑块内容'
    }
  }
}

export const Default: Story<typeof USlider> = {
  args: {
    modelValue: 50,
    min: 0,
    max: 100,
    step: 1,
    showInput: false,
    showInputControls: true,
    size: 'default',
    disabled: false,
    range: false,
    vertical: false,
    height: '200px',
    showStops: false,
    showTooltip: true,
    content: '滑块内容'
  },
  argTypes: meta.argTypes,
  render: args => ({
    components: { USlider },
    setup()
    {
      const value = ref(args.modelValue)
      const formatTooltip = (val: number) =>
      {
        return val + ' %'
      }
      const handleInput = (val: number | number[]) =>
      {
        value.value = val
      }
      return {
        args: {
          ...args,
          modelValue: value.value
        },
        value,
        formatTooltip,
        handleInput
      }
    },
    template: container(`
      <div style="width: 350px;">
        <p>{{ args.content }}</p>
        <USlider 
          v-model="value"
          :format-tooltip="formatTooltip"
          :min="args.min"
          :max="args.max"
          :step="args.step"
          :show-input="args.showInput"
          :show-input-controls="args.showInputControls"
          :size="args.size"
          :disabled="args.disabled"
          :range="args.range"
          :vertical="args.vertical"
          :height="args.height"
          :show-stops="args.showStops"
          :show-tooltip="args.showTooltip"
          @input="handleInput"
        />
      </div>
    `)
  })
}

export const Range: Story<typeof USlider> = {
  args: {
    modelValue: [20, 80],
    min: 0,
    max: 100,
    step: 1,
    showInput: false,
    showInputControls: true,
    size: 'default',
    disabled: false,
    range: true,
    vertical: false,
    height: '200px',
    showStops: true,
    showTooltip: true,
    content: '范围滑块内容'
  },
  argTypes: meta.argTypes,
  render: args => ({
    components: { USlider },
    setup()
    {
      const value = ref(args.modelValue)
      const formatTooltip = (val: number) =>
      {
        return val + ' %'
      }
      const handleInput = (val: number | number[]) =>
      {
        value.value = val
      }
      return {
        args: {
          ...args,
          modelValue: value.value
        },
        value,
        formatTooltip,
        handleInput
      }
    },
    template: container(`
      <div style="width: 350px;">
        <p>{{ args.content }}</p>
        <USlider 
          v-model="value"
          :format-tooltip="formatTooltip"
          :min="args.min"
          :max="args.max"
          :step="args.step"
          :show-input="args.showInput"
          :show-input-controls="args.showInputControls"
          :size="args.size"
          :disabled="args.disabled"
          :range="args.range"
          :vertical="args.vertical"
          :height="args.height"
          :show-stops="args.showStops"
          :show-tooltip="args.showTooltip"
          @input="handleInput"
        />
      </div>
    `)
  })
}

export const Vertical: Story<typeof USlider> = {
  args: {
    modelValue: 50,
    min: 0,
    max: 100,
    step: 1,
    showInput: false,
    showInputControls: true,
    size: 'default',
    disabled: false,
    range: false,
    vertical: true,
    height: '200px',
    showStops: false,
    showTooltip: true,
    content: '竖向滑块内容'
  },
  argTypes: meta.argTypes,
  render: args => ({
    components: { USlider },
    setup()
    {
      const value = ref(args.modelValue)
      const formatTooltip = (val: number) =>
      {
        return val + ' %'
      }
      const handleInput = (val: number | number[]) =>
      {
        value.value = val
      }
      return {
        args: {
          ...args,
          modelValue: value.value
        },
        value,
        formatTooltip,
        handleInput
      }
    },
    template: container(`
      <div style="height: 200px;">
        <p>{{ args.content }}</p>
        <USlider 
          v-model="value"
          :format-tooltip="formatTooltip"
          :min="args.min"
          :max="args.max"
          :step="args.step"
          :show-input="args.showInput"
          :show-input-controls="args.showInputControls"
          :size="args.size"
          :disabled="args.disabled"
          :range="args.range"
          :vertical="args.vertical"
          :height="args.height"
          :show-stops="args.showStops"
          :show-tooltip="args.showTooltip"
          @input="handleInput"
        />
      </div>
    `)
  })
}

export default meta