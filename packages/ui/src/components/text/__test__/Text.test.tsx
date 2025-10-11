import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { UText } from '..' // 请根据实际路径更新
import type { UTextProps } from '../types' // 请根据实际路径更新

describe('UText 组件测试', () =>
{
  it('默认渲染正确', () =>
  {
    const wrapper = mount(UText)
    expect(wrapper.exists()).toBe(true)
  })

  it('渲染正确的类型', () =>
  {
    const wrapper = mount(UText, {
      props: {
        type: 'primary', // 替换为实际的类型值
      } as UTextProps,
    })
    expect(wrapper.classes()).toContain('u-text--primary') // 假设根据类型添加的类
  })

  it('渲染正确的大小', () =>
  {
    const wrapper = mount(UText, {
      props: {
        size: 'large', // 替换为实际的大小值
      } as UTextProps,
    })
    expect(wrapper.classes()).toContain('u-text--large') // 假设根据大小添加的类
  })

  it('支持 ellipsis 属性', () =>
  {
    const wrapper = mount(UText, {
      props: {
        ellipsis: true,
      } as UTextProps,
    })
    expect(wrapper.classes()).toContain('is-ellipsis') // 假设根据 ellipsis 添加的类
  })

  it('支持 maxLine 属性', () =>
  {
    const maxLine = 2
    const wrapper = mount(UText, {
      props: {
        maxLine,
      } as UTextProps,
    })
    expect(wrapper.attributes('style')).toContain(`-webkit-line-clamp: ${maxLine}`) // 检查样式是否包含 maxLine
  })

  it('支持 tag 属性', () =>
  {
    const wrapper = mount(UText, {
      props: {
        tag: 'h1', // 替换为实际的标签值
      } as UTextProps,
    })
    expect(wrapper.element.tagName).toBe('H1') // 检查渲染的标签
  })
})
