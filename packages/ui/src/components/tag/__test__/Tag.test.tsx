import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { UTag } from '..'
import type { UTagProps } from '../types'

describe('UTag 组件测试', () =>
{
  it('默认渲染正确', () =>
  {
    const wrapper = mount(UTag)
    expect(wrapper.exists()).toBe(true)
  })

  it('渲染正确的类型', () =>
  {
    const wrapper = mount(UTag, {
      props: {
        type: 'success',
      } as UTagProps,
    })
    expect(wrapper.classes()).toContain('u-tag--success')
  })

  it('渲染正确的大小', () =>
  {
    const wrapper = mount(UTag, {
      props: {
        size: 'large',
      } as UTagProps,
    })
    expect(wrapper.classes()).toContain('u-tag--large')
  })

  it('可关闭时渲染关闭按钮', () =>
  {
    const wrapper = mount(UTag, {
      props: {
        closable: true,
      } as UTagProps,
    })
    expect(wrapper.find('.u-tag__close').exists()).toBe(true)
  })

  it('点击关闭按钮触发 close 事件', async() =>
  {
    const wrapper = mount(UTag, {
      props: {
        closable: true,
      } as UTagProps,
    })

    await wrapper.find('.u-tag__close').trigger('click')
    expect(wrapper.emitted()['close']).toBeTruthy()
  })

  it('点击标签时触发 click 事件', async() =>
  {
    const wrapper = mount(UTag, {
      props: {
        closable: true,
      } as UTagProps,
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted()['click']).toBeTruthy()
  })

  it('渲染正确的背景颜色', () =>
  {
    const color = 'red'
    const wrapper = mount(UTag, {
      props: {
        color,
      } as UTagProps,
    })
    expect(wrapper.element.style.backgroundColor).toBe(color)
  })

  it('支持 round 属性', () =>
  {
    const wrapper = mount(UTag, {
      props: {
        round: true,
      } as UTagProps,
    })
    expect(wrapper.classes()).toContain('is-round')
  })

  it('支持 border 属性', () =>
  {
    const wrapper = mount(UTag, {
      props: {
        border: true,
      } as UTagProps,
    })
    expect(wrapper.classes()).toContain('is-border')
  })

  it('支持 transition 属性', () =>
  {
    const wrapper = mount(UTag, {
      props: {
        transition: true,
      } as UTagProps,
    })
    expect(wrapper.classes()).toContain('is-transition')
  })
})
