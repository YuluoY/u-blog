import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { UInputNumber } from '..'

const createWrapper = (props = {}) => mount(UInputNumber, { props })

describe('UInputNumber 全场景单例测试', () => {
  it('默认渲染', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.u-input-number').exists()).toBe(true)
    expect(wrapper.find('.u-input-number__inner').exists()).toBe(true)
    expect(wrapper.find('input[type="number"]').exists()).toBe(true)
  })

  it('controls 显示增减按钮', () => {
    const w1 = createWrapper({ controls: true })
    expect(w1.find('.u-input-number__decrease').exists()).toBe(true)
    expect(w1.find('.u-input-number__increase').exists()).toBe(true)
    const w2 = createWrapper({ controls: false })
    expect(w2.find('.u-input-number__decrease').exists()).toBe(false)
  })

  it('v-model 与 min/max/step', async () => {
    const wrapper = createWrapper({
      modelValue: 5,
      min: 0,
      max: 10,
      step: 1
    })
    const input = wrapper.find('input')
    expect(input.element.value).toBe('5')
    await wrapper.find('.u-input-number__increase').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([6])
    await wrapper.setProps({ modelValue: 6 })
    await wrapper.find('.u-input-number__decrease').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toContainEqual([5])
  })

  it('disabled 时按钮禁用', () => {
    const wrapper = createWrapper({ disabled: true })
    expect(wrapper.find('.u-input-number__decrease').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.u-input-number__increase').attributes('disabled')).toBeDefined()
  })

  it('input 输入触发 update:modelValue', async () => {
    const wrapper = createWrapper({ modelValue: 0, min: 0, max: 100 })
    await wrapper.find('input').setValue(42)
    await wrapper.find('input').trigger('input')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('aria-label', () => {
    const wrapper = createWrapper({ ariaLabel: '数量' })
    expect(wrapper.find('input').attributes('aria-label')).toBe('数量')
  })
})
