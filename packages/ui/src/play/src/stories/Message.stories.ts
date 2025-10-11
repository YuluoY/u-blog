import type { Meta } from '@storybook/vue3'
import { UMessageFn as UMessage, UButton } from 'ucc-ui'
import 'ucc-ui/dist/index.css'
import type {  UMessageInstance } from '../../../components/message/types'
import type { Story } from './types'
import { container } from './utils'

const meta: Meta<typeof UMessage> = {
  title: 'Components/Message',
  component: UMessage,
  tags: ['autodocs'],
  argTypes: {
    message: {
      control: 'text',
      description: '消息文字'
    },
    type: {
      control: 'select',
      options: ['success', 'warning', 'info', 'error'],
      description: '消息类型'
    },
    duration: {
      control: 'number',
      description: '显示时间，单位为毫秒。设为 0 则不会自动关闭'
    },
    showClose: {
      control: 'boolean',
      description: '是否显示关闭按钮'
    },
    center: {
      control: 'boolean',
      description: '文字是否居中'
    },
    offset: {
      control: 'number',
      description: 'Message 距离窗口顶部的偏移量'
    },
    icon: {
      control: 'text',
      description: '自定义图标'
    },
    dangerouslyUseHTMLString: {
      control: 'boolean',
      description: '是否将 message 属性作为 HTML 片段处理'
    },
    onClose: {
      control: 'function',
      description: '关闭时的回调函数'
    },
    content: {
      control: 'text',
      description: '消息内容'
    }
  }
}

export const Default: Story<typeof UMessage> = {
  args: {
    message: '这是一条消息提示',
    type: 'info',
    duration: 3000,
    showClose: true,
    center: false,
    offset: 20,
    icon: '',
    dangerouslyUseHTMLString: false,
    content: '消息内容'
  },
  argTypes: meta.argTypes,
  render: (args) => ({
    components: { UButton },
    setup() {
      const showMessage = () => {
        const instance: UMessageInstance = UMessage({
          ...args,
          onClose: () => {
            console.log('消息关闭')
          }
        })
        // 可以通过实例手动关闭
        setTimeout(() => {
          instance.close()
        }, args.duration)
      }
      return { args, showMessage }
    },
    template: container(`
      <div>
        <p>{{ args.content }}</p>
        <UButton @click="showMessage">显示消息</UButton>
      </div>
    `)
  })
}

export const Types: Story<typeof UMessage> = {
  args: {
    content: '不同类型的消息'
  },
  argTypes: meta.argTypes,
  render: (args) => ({
    components: { UButton },
    setup() {
      const showSuccess = () => {
        UMessage.success({
          message: '这是一条成功消息',
          onClose: () => {
            console.log('成功消息关闭')
          }
        })
      }
      const showWarning = () => {
        UMessage.warning({
          message: '这是一条警告消息',
          onClose: () => {
            console.log('警告消息关闭')
          }
        })
      }
      const showInfo = () => {
        UMessage.info({
          message: '这是一条信息消息',
          onClose: () => {
            console.log('信息消息关闭')
          }
        })
      }
      const showError = () => {
        UMessage.error({
          message: '这是一条错误消息',
          onClose: () => {
            console.log('错误消息关闭')
          }
        })
      }
      return { args, showSuccess, showWarning, showInfo, showError }
    },
    template: container(`
      <div>
        <p>{{ args.content }}</p>
        <div>
          <UButton type="success" @click="showSuccess" style="margin-right: 10px">成功</UButton>
          <UButton type="warning" @click="showWarning" style="margin-right: 10px">警告</UButton>
          <UButton type="info" @click="showInfo" style="margin-right: 10px">信息</UButton>
          <UButton type="danger" @click="showError">错误</UButton>
        </div>
      </div>
    `)
  })
}

export default meta 