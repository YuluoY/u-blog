import type { Meta } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import { UInput, UIcon } from 'ucc-ui'
import 'ucc-ui/dist/index.css'
import type { UInputProps } from '../../../components/input/types'
import type { Story } from './types'
import { container } from './utils'
import { ref } from 'vue'

const meta: Meta<typeof UInput> = {
  title: 'Components/Input',
  component: UInput,
  tags: ['autodocs'],
  argTypes: {
    modelValue: {
      control: 'text',
      description: '输入框的值'
    },
    type: {
      control: 'select',
      options: ['text', 'textarea', 'password', 'number', 'email', 'tel', 'url'],
      description: '输入框类型'
    },
    placeholder: {
      control: 'text',
      description: '占位文本'
    },
    clearable: {
      control: 'boolean',
      description: '是否可清空'
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用'
    },
    readonly: {
      control: 'boolean',
      description: '是否只读'
    },
    maxlength: {
      control: 'number',
      description: '最大输入长度'
    },
    showWordLimit: {
      control: 'boolean',
      description: '是否显示输入字数统计'
    },
    size: {
      control: 'select',
      options: ['large', 'default', 'small'],
      description: '输入框大小'
    },
    prefixIcon: {
      control: 'text',
      description: '前缀图标'
    },
    suffixIcon: {
      control: 'text',
      description: '后缀图标'
    },
    content: {
      control: 'text',
      description: '输入框内容'
    }
  }
}

export const Default: Story<typeof UInput> = {
  args: {
    modelValue: '',
    type: 'text',
    placeholder: '请输入内容',
    clearable: true,
    disabled: false,
    readonly: false,
    maxlength: 20,
    showWordLimit: true,
    size: 'default',
    prefixIcon: 'search',
    suffixIcon: '',
    content: '输入框内容'
  },
  argTypes: meta.argTypes,
  render: (args) => ({
    components: { UInput, UIcon },
    setup() {
      const value = ref(args.modelValue)
      const handleInput = (val: string) => {
        value.value = val
      }
      const handleUpdate = (val: string) => {
        value.value = val
      }
      return { args, value, handleInput, handleUpdate }
    },
    template: container(`
      <UInput 
        v-bind="args" 
        v-model="value"
        @input="handleInput"
        @update:modelValue="handleUpdate"
      >
        <template v-if="args.prefixIcon" #prefix>
          <UIcon :icon="args.prefixIcon" />
        </template>
        <template v-if="args.suffixIcon" #suffix>
          <UIcon :icon="args.suffixIcon" />
        </template>
      </UInput>
    `)
  })
}

export default meta 