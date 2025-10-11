import type { Meta } from '@storybook/vue3'
import { UDialog, UButton } from 'ucc-ui'
import 'ucc-ui/dist/index.css'
import type { Story } from './types'
import { container } from './utils'
import { ref } from 'vue'

const meta: Meta<typeof UDialog> = {
  title: 'Components/Dialog',
  component: UDialog,
  tags: ['autodocs'],
  argTypes: {
    modelValue: {
      control: 'boolean',
      description: '是否显示'
    },
    title: {
      control: 'text',
      description: '标题'
    },
    content: {
      control: 'text',
      description: '内容'
    },
    width: {
      control: 'number',
      description: '宽度'
    },
    height: {
      control: 'number',
      description: '高度'
    },
    modal: {
      control: 'boolean',
      description: '是否需要遮罩层'
    },
    modalClass: {
      control: 'text',
      description: '遮罩层自定义类名'
    },
    closeIcon: {
      control: 'text',
      description: '关闭图标'
    },
    collapseIcon: {
      control: 'text',
      description: '折叠图标'
    },
    appendTo: {
      control: 'text',
      description: '容器元素'
    },
    openDelay: {
      control: 'number',
      description: '打开延时'
    },
    closeDelay: {
      control: 'number',
      description: '关闭延时'
    },
    closeOnClickModal: {
      control: 'boolean',
      description: '是否可以点击遮罩层关闭'
    },
    closeOnPressEscape: {
      control: 'boolean',
      description: '是否可以使用ESC按键关闭'
    },
    showCollapseIcon: {
      control: 'boolean',
      description: '是否显示折叠按钮'
    },
    showCloseIcon: {
      control: 'boolean',
      description: '是否显示关闭按钮'
    },
    zIndex: {
      control: 'number',
      description: '层级'
    },
    showFooter: {
      control: 'boolean',
      description: '是否显示底部按钮'
    }
  }
}

export const Default: Story<typeof UDialog> = {
  args: {
    modelValue: false,
    title: '对话框标题',
    content: '这是对话框的内容',
    width: 0.4,
    height: 0.4,
    modal: true,
    modalClass: '',
    closeIcon: '',
    collapseIcon: '',
    appendTo: 'body',
    openDelay: 0,
    closeDelay: 0,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    showCollapseIcon: false,
    showCloseIcon: true,
    zIndex: 2000,
    showFooter: true
  },
  argTypes: meta.argTypes,
  render: args => ({
    components: { UDialog, UButton },
    setup()
    {
      const visible = ref(args.modelValue)
      const handleOpen = () =>
      {
        visible.value = true
      }
      const handleClose = () =>
      {
        visible.value = false
      }
      const handleOpened = () =>
      {
        console.log('Dialog opened')
      }
      const handleClosed = () =>
      {
        console.log('Dialog closed')
      }
      return { args, visible, handleOpen, handleClose, handleOpened, handleClosed }
    },
    template: container(`
      <div>
        <UButton @click="handleOpen">打开对话框</UButton>
        <UDialog 
          v-bind="args"
          v-model="visible"
          @open="handleOpened"
          @close="handleClose"
          @closed="handleClosed"
        >
          <template #default>
            <p>{{ args.content }}</p>
          </template>
          <template #footer>
            <UButton @click="handleClose">取消</UButton>
            <UButton type="primary" @click="handleClose">确定</UButton>
          </template>
        </UDialog>
      </div>
    `)
  })
}

export default meta