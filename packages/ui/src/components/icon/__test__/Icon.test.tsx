// UIcon.spec.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { UIcon } from '../index'
import type { UIconProps } from '../types'

describe('UIcon 组件', () =>
{
  it('默认渲染正确', () =>
  {
    const wrapper = mount(UIcon, { props: { icon:'home' } })
    expect(wrapper.exists()).toBe(true)
  })

  it('渲染 icon 正确', () =>
  {
    const wrapper = mount(UIcon, {
      props: {
        icon: 'home',
      } as UIconProps,
    })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('渲染 border 正确', () =>
  {
    const wrapper = mount(UIcon, {
      props: {
        icon: 'home',
        border: true,
      } as UIconProps,
    })
    expect(wrapper.find('svg').classes()).toContain('fa-border')
  })

  it('渲染 fixedWidth 正确', () =>
  {
    const wrapper = mount(UIcon, {
      props: {
        icon: 'home',
        fixedWidth: true,
      } as UIconProps,
    })
    expect(wrapper.find('svg').classes()).toContain('fa-fw')
  })

  it('渲染 flip 属性', () =>
  {
    const wrapper = mount(UIcon, {
      props: {
        icon: 'home',
        flip: 'horizontal',
      } as UIconProps,
    })
    expect(wrapper.find('svg').classes()).toContain('fa-flip-horizontal')
  })

  it('渲染 rotation 属性', () =>
  {
    const wrapper = mount(UIcon, {
      props: {
        icon: 'home',
        rotation: 90,
      } as UIconProps,
    })
    expect(wrapper.find('svg').classes()).toContain('fa-rotate-90')
  })

  it('渲染 size 属性', () =>
  {
    const wrapper = mount(UIcon, {
      props: {
        icon: 'home',
        size: '2x',
      } as UIconProps,
    })
    expect(wrapper.find('svg').classes()).toContain('fa-2x')
  })

  it('渲染 spin 属性', () =>
  {
    const wrapper = mount(UIcon, {
      props: {
        icon: 'home',
        spin: true,
      } as UIconProps,
    })
    expect(wrapper.find('svg').classes()).toContain('fa-spin')
  })

  it('渲染 pulse 属性', () =>
  {
    const wrapper = mount(UIcon, {
      props: {
        icon: 'home',
        pulse: true,
      } as UIconProps,
    })
    expect(wrapper.find('svg').classes()).toContain('fa-pulse')
  })

  it('渲染颜色正确', () =>
  {
    const RED = 'rgb(255, 0, 0)'
    const wrapper = mount(UIcon, {
      props: {
        icon: 'home',
        color: RED,
      } as UIconProps,
    })
    expect(wrapper.attributes('style')).toContain(`color: ${RED};`)
  })

  it('渲染其他自定义属性（如 bounce、shake、fade）', () =>
  {
    const wrapper = mount(UIcon, {
      props: {
        icon: 'home',
        bounce: true,
        shake: true,
        fade: true,
      } as UIconProps,
    })
    const Svg = wrapper.find('svg')
    expect(Svg.classes()).toContain('fa-bounce')
    expect(Svg.classes()).toContain('fa-shake')
    expect(Svg.classes()).toContain('fa-fade')
  })

  it('支持 listItem 属性', () =>
  {
    const wrapper = mount(UIcon, {
      props: {
        icon: 'home',
        listItem: true,
      } as UIconProps,
    })
    expect(wrapper.find('svg').classes()).toContain('fa-li')
  })

  it('支持 transform 属性', () =>
  {
    const wrapper = mount(UIcon, {
      props: {
        icon: 'home',
        transform: 'shrink-4 right-1',
      } as UIconProps,
    })
    expect(!!wrapper.find('svg').element.style.transformOrigin).toBe(true)
  })

  it('支持 title 属性', () =>
  {
    const title = '首页图标'
    const wrapper = mount(UIcon, {
      props: {
        icon: 'home',
        title: title,
      } as UIconProps,
    })
    expect(wrapper.find('title').text()).toEqual(title)
  })
})
