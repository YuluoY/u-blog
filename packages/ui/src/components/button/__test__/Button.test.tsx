import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import UButton from '../src/Button.vue'
import type { UButtonProps } from '../types'

// 创建通用的测试配置
const createWrapper = (props = {}, options = {}) =>
{
  return mount(UButton, {
    props,
    ...options
  })
}

describe('UButton 组件覆盖测试', () =>
{
  it('默认渲染正确', () =>
  {
    const wrapper = createWrapper()
    expect(wrapper.classes()).toContain('u-button')
    expect(wrapper.exists()).toBe(true)
  })

  it('根据类型渲染正确', () =>
  {
    const wrapper = createWrapper({
      type: 'primary'
    } as UButtonProps)
    expect(wrapper.classes()).toContain('u-button--primary')
  })

  it('根据尺寸渲染正确', () =>
  {
    const wrapper = createWrapper({
      size: 'large'
    } as UButtonProps)
    expect(wrapper.classes()).toContain('u-button--large')
  })

  it('图标渲染正确', () =>
  {
    const wrapper = createWrapper({
      icon: 'check'
    } as UButtonProps)
    expect(wrapper.find('.u-icon').exists()).toBe(true)
  })

  it('正确处理点击事件', async() =>
  {
    const onClick = vi.fn()
    const wrapper = createWrapper({
      onClick
    })
    await wrapper.trigger('click')
    expect(onClick).toHaveBeenCalled()
  })

  it('当 `disabled` 属性为 true 时禁用按钮', async() =>
  {
    const wrapper = createWrapper({
      disabled: true
    } as UButtonProps)
    expect(wrapper.attributes('disabled')).toBe('')
    expect(wrapper.classes()).toContain('is-disabled')
  })

  it('加载状态渲染正确', () =>
  {
    const wrapper = createWrapper({
      icon: 'home',
      loading: true,
      loadingIcon: 'spinner'
    } as UButtonProps)
    expect(wrapper.classes()).toContain('is-loading')
    expect(wrapper.find('.u-button__icon').exists()).toBe(true)
  })

  it('链接类型渲染正确', () =>
  {
    const wrapper = createWrapper({
      link: true
    } as UButtonProps)
    expect(wrapper.classes()).toContain('is-link')
  })

  it('自定义背景颜色渲染正确', () =>
  {
    const Color = 'rgb(255, 0, 0)'
    const wrapper = createWrapper({
      color: Color
    } as UButtonProps)
    expect(wrapper.attributes('style')).toContain(`background-color: ${Color}`)
  })

  it('正确触发节流功能', async() =>
  {
    const onClick = vi.fn()
    const wrapper = createWrapper({
      onClick,
      useThrottle: true,
      throttleTime: 200
    } as UButtonProps)

    await wrapper.trigger('click')
    await wrapper.trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('正确触发防抖功能', async() =>
  {
    vi.useFakeTimers()
    const onClick = vi.fn()
    const wrapper = createWrapper({
      onClick,
      useDebounce: true,
      debounceTime: 200
    } as UButtonProps)

    await wrapper.trigger('click')
    await wrapper.trigger('click')
    vi.advanceTimersByTime(200)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})