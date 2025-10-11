import type { Meta, StoryObj } from '@storybook/vue3'
import { UForm, UFormItem, UInput, UButton } from 'ucc-ui'
import 'ucc-ui/dist/index.css'
import type { UFormExposes } from '../../../components/form/types'
import { container } from './utils'
import { ref } from 'vue'

const meta = {
  title: 'Components/Form',
  component: UForm,
  tags: ['autodocs'],
  argTypes: {
    model: {
      control: 'object',
      description: '表单数据对象'
    },
    rules: {
      control: 'object',
      description: '表单验证规则'
    },
    inline: {
      control: 'boolean',
      description: '是否行内表单'
    },
    labelPosition: {
      control: 'select',
      options: ['right', 'left', 'top'],
      description: '表单域标签的位置'
    },
    labelWidth: {
      control: 'text',
      description: '表单域标签的宽度'
    },
    labelSuffix: {
      control: 'text',
      description: '表单域标签的后缀'
    },
    hideRequiredAsterisk: {
      control: 'boolean',
      description: '是否隐藏必填字段的标签旁边的红色星号'
    },
    showMessage: {
      control: 'boolean',
      description: '是否显示校验错误信息'
    },
    size: {
      control: 'select',
      options: ['large', 'default', 'small'],
      description: '用于控制该表单内组件的尺寸'
    }
  }
} satisfies Meta<typeof UForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    model: {
      name: '',
      email: ''
    },
    rules: {
      name: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 5, message: '长度在 2 到 5 个字符', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
      ]
    },
    labelPosition: 'right',
    labelWidth: '100px',
    labelSuffix: '',
    hideRequiredAsterisk: false,
    showMessage: true,
    size: 'default'
  },
  render: args => ({
    components: { UForm, UFormItem, UInput, UButton },
    setup()
    {
      const formRef = ref<UFormExposes>()
      const formModel = ref(args.model)
      
      const handleSubmit = async() =>
      {
        if (!formRef.value) return
        try
        {
          await formRef.value.validate()
          console.log('表单验证通过', formModel.value)
        }
        catch (error)
        {
          console.error('表单验证失败', error)
        }
      }

      const handleReset = () =>
      {
        if (!formRef.value) return
        formRef.value.resetFields()
        formModel.value = {
          name: '',
          email: ''
        }
      }

      return { args, formRef, formModel, handleSubmit, handleReset }
    },
    template: container(`
      <UForm
        ref="formRef"
        v-bind="args"
        :model="formModel"
        :rules="args.rules"
        style="max-width: 460px;"
      >
        <UFormItem label="姓名" prop="name">
          <UInput v-model="formModel.name" />
        </UFormItem>
        <UFormItem label="邮箱" prop="email">
          <UInput v-model="formModel.email" />
        </UFormItem>
        <UFormItem>
          <UButton type="primary" @click="handleSubmit">提交</UButton>
          <UButton style="margin-left: 10px;" @click="handleReset">重置</UButton>
        </UFormItem>
      </UForm>
    `)
  })
}