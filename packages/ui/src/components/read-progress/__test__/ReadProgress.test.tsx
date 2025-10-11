import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { UReadProgress } from '..'
import type { UReadProgressProps } from '../types'
import { nextTick } from 'vue'
import { rootFontSize } from '@/utils'

// 创建通用的测试配置
const createWrapper = (props = {}, options = {}) =>
{
  return mount(UReadProgress, {
    props,
    ...options
  })
}

describe('UReadProgress 组件测试', () =>
{
  // 设置 requestAnimationFrame mock
  beforeEach(() =>
  {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb =>
    {
      cb(0)
      return 0
    })
    
    // 模拟 window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      configurable: true
    })
  })

  afterEach(() =>
  {
    vi.restoreAllMocks()
  })

  // 基础渲染测试
  it('默认渲染正确', () =>
  {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.classes()).toContain('u-read-progress')
  })

  // 进度条类型测试
  it('根据类型渲染正确', () =>
  {
    const wrapper = createWrapper({
      type: 'success'
    } as UReadProgressProps)
    expect(wrapper.find('.u-read-progress__bar--success').exists()).toBe(true)
  })

  // 进度条高度测试
  it('高度设置正确', () =>
  {
    const height = 8
    const wrapper = createWrapper({
      height
    } as UReadProgressProps)
    const style = wrapper.attributes('style')
    const expectedHeight = `${height / rootFontSize}rem`
    expect(style).toContain(`height: ${expectedHeight}`)
    expect(style).toContain('background-color: transparent')
  })

  // 进度条颜色测试
  it('自定义颜色渲染正确', () =>
  {
    const color = 'rgb(255, 0, 0)'
    const wrapper = createWrapper({
      color
    } as UReadProgressProps)
    const bar = wrapper.find('.u-read-progress__bar')
    expect(bar.attributes('style')).toContain(`background-color: ${color}`)
  })

  // 进度条背景色测试
  it('背景颜色设置正确', () =>
  {
    const backgroundColor = 'rgb(0, 0, 255)'
    const wrapper = createWrapper({
      backgroundColor
    } as UReadProgressProps)
    expect(wrapper.attributes('style')).toContain(`background-color: ${backgroundColor}`)
  })

  // 进度值测试
  it('进度值显示正确', async() =>
  {
    const wrapper = createWrapper({
      modelValue: 50,
      showText: true
    } as UReadProgressProps)
    
    const bar = wrapper.find('.u-read-progress__bar')
    expect(bar.attributes('style')).toContain('width: 50%')
    
    await wrapper.setProps({ modelValue: 75 })
    expect(bar.attributes('style')).toContain('width: 75%')
  })

  // 显示/隐藏测试
  it('显示/隐藏功能正确', async() =>
  {
    const wrapper = createWrapper({
      show: true
    } as UReadProgressProps)
    
    expect(wrapper.attributes('style')).not.toContain('display: none')
    
    await wrapper.setProps({ show: false })
    await nextTick()
    expect(wrapper.attributes('style')).toContain('display: none')
  })

  // 文本显示测试
  it('文本显示正确', () =>
  {
    const wrapper = createWrapper({
      modelValue: 50,
      showText: true,
      content: '自定义文本'
    } as UReadProgressProps)
    
    const text = wrapper.find('.u-read-progress__text')
    expect(text.exists()).toBe(true)
    expect(text.text()).toBe('自定义文本')
  })

  // 默认文本显示测试
  it('默认文本显示正确', () =>
  {
    const wrapper = createWrapper({
      modelValue: 50,
      showText: true
    } as UReadProgressProps)
    
    const text = wrapper.find('.u-read-progress__text')
    expect(text.exists()).toBe(true)
    expect(text.text()).toBe('50%')
  })

  // 事件测试
  it('事件触发正确', async() =>
  {
    const wrapper = createWrapper({
      modelValue: 0
    } as UReadProgressProps)
    
    // 模拟滚动事件
    const scrollEvent = new Event('scroll')
    Object.defineProperties(document.documentElement, {
      scrollTop: { value: 100, configurable: true },
      scrollHeight: { value: 1000, configurable: true },
      clientHeight: { value: 800, configurable: true }
    })
    
    document.dispatchEvent(scrollEvent)
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    
    const emitted = wrapper.emitted()
    expect(emitted['update:modelValue']).toBeTruthy()
    expect(emitted['change']).toBeTruthy()
  })

  // 方法测试
  it('expose方法正确', async() =>
  {
    const wrapper = createWrapper()
    
    // 测试 hide 方法
    wrapper.vm.hide()
    await nextTick()
    expect(wrapper.attributes('style')).toContain('display: none')
    
    // 测试 show 方法
    wrapper.vm.show()
    await nextTick()
    expect(wrapper.attributes('style')).not.toContain('display: none')
    
    // 测试 progress 值
    expect(wrapper.vm.progress).toBeDefined()
  })
})