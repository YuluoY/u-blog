import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { UForm, UFormItem } from '..'
import { UInput } from '@/components'
import type { UFormItemProps } from '../types'
import { nextTick } from 'vue'

interface FormModel {
  name: string
}

type ComponentInstance = {
  model: FormModel
  rules?: Record<string, any>
}

describe('UFormItem 组件测试', () =>
{
  // 基础渲染测试
  it('默认渲染正确', () =>
  {
    const wrapper = mount(UFormItem)
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.classes()).toContain('u-form-item')
  })

  // 标签渲染测试
  it('标签渲染正确', () =>
  {
    const wrapper = mount(UFormItem, {
      props: {
        label: '测试标签'
      } as UFormItemProps
    })
    expect(wrapper.find('.u-form-item__label').text()).toBe('测试标签')
  })

  // 验证状态测试
  it('验证状态渲染正确', async() =>
  {
    const wrapper = mount({
      template: `
        <UForm :model="model" :rules="rules">
          <UFormItem prop="name" ref="formItem">
            <UInput v-model="model.name" />
          </UFormItem>
        </UForm>
      `,
      components: {
        UForm,
        UFormItem,
        UInput
      },
      data()
      {
        return {
          model: {
            name: ''
          } as FormModel,
          rules: {
            name: [
              { required: true, message: '请输入名称', trigger: 'blur' }
            ]
          }
        }
      }
    })

    const formItem = wrapper.findComponent({ ref: 'formItem' })
    try
    {
      await formItem.vm.validate('blur')
    }
    catch (error)
    {
      // 预期会抛出验证错误
    }
    await nextTick()

    // 检查错误状态
    expect(wrapper.find('.u-form-item').classes()).toContain('u-form-item--error')
    expect(wrapper.find('.u-form-item__error').exists()).toBe(true)

    // 输入有效值后再次验证
    await wrapper.find('input').setValue('测试值')
    await formItem.vm.validate('blur')
    await nextTick()

    // 检查成功状态
    expect(wrapper.find('.u-form-item').classes()).toContain('u-form-item--success')
  })

  // 错误消息显示测试
  it('错误消息显示正确', async() =>
  {
    const errorMessage = '请输入名称'
    const wrapper = mount({
      template: `
        <UForm :model="model" :rules="rules" ref="form">
          <UFormItem prop="name">
            <UInput v-model="model.name" />
          </UFormItem>
        </UForm>
      `,
      components: {
        UForm,
        UFormItem,
        UInput
      },
      data()
      {
        return {
          model: {
            name: ''
          },
          rules: {
            name: [
              { required: true, message: errorMessage, trigger: 'blur' }
            ]
          }
        }
      }
    })

    const form = wrapper.vm.$refs.form as any
    await form.validate()
    await nextTick()

    expect(wrapper.find('.u-form-item__error').text()).toBe(errorMessage)
  })

  // 行内错误消息测试
  it('行内错误消息渲染正确', async() =>
  {
    const wrapper = mount({
      template: `
        <UForm :model="model" :rules="rules" :inline-message="true" ref="form">
          <UFormItem prop="name">
            <UInput v-model="model.name" />
          </UFormItem>
        </UForm>
      `,
      components: {
        UForm,
        UFormItem,
        UInput
      },
      data()
      {
        return {
          model: {
            name: ''
          },
          rules: {
            name: [
              { required: true, message: '请输入名称', trigger: 'blur' }
            ]
          }
        }
      }
    })

    const form = wrapper.vm.$refs.form as any
    await form.validate()
    await nextTick()

    expect(wrapper.find('.u-form-item__error--inline').exists()).toBe(true)
  })

  // 标签宽度测试
  it('标签宽度渲染正确', () =>
  {
    const labelWidth = '100px'
    const wrapper = mount(UFormItem, {
      props: {
        label: '测试标签',
        labelWidth
      } as UFormItemProps
    })

    const label = wrapper.find('.u-form-item__label')
    expect(label.attributes('style')).toContain(`width: ${labelWidth}`)
  })

  // 必填标记位置测试
  it('必填标记位置渲染正确', () =>
  {
    const wrapper = mount({
      template: `
        <UForm :model="model" :rules="rules" required-asterisk-position="right">
          <UFormItem label="测试" prop="name">
            <UInput v-model="model.name" />
          </UFormItem>
        </UForm>
      `,
      components: {
        UForm,
        UFormItem,
        UInput
      },
      data()
      {
        return {
          model: {
            name: ''
          },
          rules: {
            name: [
              { required: true, message: '请输入名称', trigger: 'blur' }
            ]
          }
        }
      }
    })

    const star = wrapper.find('.u-form-item__required-star')
    expect(star.classes()).toContain('is-right')
  })

  // 重置字段测试
  it('重置字段功能正确', async() =>
  {
    const wrapper = mount({
      template: `
        <UForm :model="model" ref="form">
          <UFormItem prop="name" ref="formItem">
            <UInput v-model="model.name" />
          </UFormItem>
        </UForm>
      `,
      components: {
        UForm,
        UFormItem,
        UInput
      },
      data()
      {
        return {
          model: {
            name: ''
          } as FormModel
        }
      }
    })

    // 设置值并验证
    const vm = wrapper.vm as unknown as ComponentInstance
    vm.model.name = '测试值'
    await nextTick()

    const formItem = wrapper.findComponent({ ref: 'formItem' })
    await formItem.vm.resetField()
    await nextTick()

    expect(vm.model.name).toBe('')
  })

  // 清除验证测试
  it('清除验证功能正确', async() =>
  {
    const wrapper = mount({
      template: `
        <UForm :model="model" :rules="rules" ref="form">
          <UFormItem prop="name" ref="formItem">
            <UInput v-model="model.name" />
          </UFormItem>
        </UForm>
      `,
      components: {
        UForm,
        UFormItem,
        UInput
      },
      data()
      {
        return {
          model: {
            name: ''
          },
          rules: {
            name: [
              { required: true, message: '请输入名称', trigger: 'blur' }
            ]
          }
        }
      }
    })

    // 先触发验证
    const form = wrapper.vm.$refs.form as any
    const formItem = wrapper.findComponent({ ref: 'formItem' })
    
    await form.validate()
    await nextTick()

    expect(wrapper.find('.u-form-item').classes()).toContain('u-form-item--error')

    // 清除验证
    await formItem.vm.clearValidate()
    await nextTick()

    expect(wrapper.find('.u-form-item').classes()).not.toContain('u-form-item--error')
  })
})