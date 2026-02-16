import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { UImage } from '..'
import type { UImageProps } from '../types'

const createWrapper = (props: Partial<UImageProps> = {}, slots = {}) =>
  mount(UImage, { props, slots })

describe('UImage 全场景单例测试', () => {
  it('默认渲染', () => {
    const wrapper = createWrapper({ src: 'https://example.com/a.jpg' })
    expect(wrapper.find('.u-image').exists()).toBe(true)
    expect(wrapper.find('img').exists()).toBe(true)
    expect(wrapper.find('img').attributes('src')).toBe('https://example.com/a.jpg')
  })

  it('alt 属性', () => {
    const wrapper = createWrapper({ src: '/x.png', alt: '描述' })
    expect(wrapper.find('img').attributes('alt')).toBe('描述')
  })

  it('fit 属性', () => {
    const wrapper = createWrapper({ src: '/x.png', fit: 'contain' })
    expect(wrapper.find('img').element.style.objectFit).toBe('contain')
  })

  it('宽高样式', () => {
    const wrapper = createWrapper({ src: '/x.png', width: 200, height: 100 })
    const el = wrapper.find('.u-image').element as HTMLElement
    expect(el.style.width).toBe('200px')
    expect(el.style.height).toBe('100px')
  })

  it('加载失败显示 error 区域', async () => {
    const wrapper = createWrapper({ src: 'invalid', showLoading: false })
    const img = wrapper.find('img')
    await img.trigger('error')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.u-image__error').exists()).toBe(true)
  })

  it('click 事件', async () => {
    const onClick = vi.fn()
    const wrapper = createWrapper({ src: '/x.png' }, {})
    wrapper.vm.$emit = vi.fn()
    await wrapper.find('.u-image').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('expose reload', () => {
    const wrapper = createWrapper({ src: '/x.png' })
    expect(typeof (wrapper.vm as any).reload).toBe('function')
    ;(wrapper.vm as any).reload()
  })
})
