// UInput.spec.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { UInput } from '..'
import type { UInputProps } from '../types'
import { ref } from 'vue'
import { FORM_ITEM_SIZE_INJECTION_KEY } from '@/components'

// 创建通用的测试配置
const createWrapper = (props = {}, options = {}) =>
{
  return mount(UInput, {
    props,
    global: {
      provide: {
        [FORM_ITEM_SIZE_INJECTION_KEY as symbol]: ref(undefined)
      }
    },
    ...options
  })
}

describe('UInput 组件测试', () =>
{
  it('默认渲染正确', () =>
  {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.classes()).toContain('u-input')
  })

  it('渲染 input 类型', () =>
  {
    const wrapper = createWrapper({
      modelValue: '测试',
      type: 'text'
    } as UInputProps)
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
  })

  it('渲染 placeholder', () =>
  {
    const wrapper = createWrapper({
      placeholder: '请输入内容'
    } as UInputProps)
    expect(wrapper.find('input').attributes('placeholder')).toBe('请输入内容')
  })

  it('支持 clearable 属性', async() =>
  {
    const wrapper = createWrapper({
      modelValue: '内容',
      clearable: true
    } as UInputProps)

    const clearButton = wrapper.find('.u-input__clear')
    await clearButton.trigger('click')
    expect(wrapper.emitted()['update:modelValue']).toBeTruthy()
    expect(wrapper.emitted()['update:modelValue'][0]).toEqual([''])
  })

  it('渲染 disabled 状态', () =>
  {
    const wrapper = createWrapper({
      disabled: true
    } as UInputProps)
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.find('input').attributes('disabled')).toBe('')
  })

  it('支持 max 属性', () =>
  {
    const wrapper = createWrapper({
      max: 10
    } as UInputProps)
    expect(wrapper.find('input').attributes('max')).toBe('10')
  })

  it('支持 autofocus 属性', () =>
  {
    const wrapper = createWrapper({
      autofocus: true
    } as UInputProps)
    expect(wrapper.find('input').attributes('autofocus')).toBe('')
  })

  it('支持事件: change', async() =>
  {
    const wrapper = createWrapper({
      modelValue: ''
    } as UInputProps)

    await wrapper.find('input').setValue('新的值')
    expect(wrapper.emitted().change).toBeTruthy()
    expect(wrapper.emitted().change[0]).toEqual(['新的值'])
  })

  it('支持事件: input', async() =>
  {
    const wrapper = createWrapper({
      modelValue: ''
    } as UInputProps)

    await wrapper.find('input').setValue('输入内容')
    expect(wrapper.emitted().input).toBeTruthy()
    expect(wrapper.emitted().input[0]).toEqual([expect.any(Object)])
  })

  it('支持 prefixIcon 和 suffixIcon', () =>
  {
    const wrapper = createWrapper({
      prefixIcon: 'home',
      suffixIcon: 'check'
    } as UInputProps)
    expect(wrapper.find('.u-input__prefix svg').exists()).toBe(true)
    expect(wrapper.find('.u-input__suffix svg').exists()).toBe(true)
  })
})
