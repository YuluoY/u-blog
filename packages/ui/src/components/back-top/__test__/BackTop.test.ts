import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

describe('UBackTop', () => {
  // 模拟 pxToRem
  vi.mock('@u-blog/utils', () => ({
    pxToRem: (v: number) => `${v / 16}rem`
  }))

  // 模拟 useLocale
  vi.mock('@/components/config-provider', () => ({
    useLocale: () => ({
      t: (key: string) => key
    })
  }))

  let BackTop: any

  beforeEach(async () => {
    // 模拟 scrollTop
    Object.defineProperty(document.documentElement, 'scrollTop', {
      value: 0,
      writable: true,
      configurable: true,
    })
    const mod = await import('../src/BackTop.vue')
    BackTop = mod.default
  })

  it('应该正确渲染组件', () => {
    const wrapper = mount(BackTop, {
      global: {
        stubs: { Teleport: true }
      }
    })
    expect(wrapper.find('.u-back-top').exists()).toBe(true)
  })

  it('初始时应该隐藏', () => {
    const wrapper = mount(BackTop, {
      global: {
        stubs: { Teleport: true }
      }
    })
    // v-show 控制，元素存在但 display:none
    expect(wrapper.find('.u-back-top').isVisible()).toBe(false)
  })

  it('应该使用圆形形状作为默认', () => {
    const wrapper = mount(BackTop, {
      global: {
        stubs: { Teleport: true }
      }
    })
    expect(wrapper.find('.u-back-top--circle').exists()).toBe(true)
  })

  it('应该支持方形形状', () => {
    const wrapper = mount(BackTop, {
      props: { shape: 'square' },
      global: {
        stubs: { Teleport: true }
      }
    })
    expect(wrapper.find('.u-back-top--square').exists()).toBe(true)
  })

  it('应该支持不同主题类型', () => {
    const wrapper = mount(BackTop, {
      props: { type: 'success' },
      global: {
        stubs: { Teleport: true }
      }
    })
    expect(wrapper.find('.u-back-top--success').exists()).toBe(true)
  })

  it('应该包含默认 SVG 图标', () => {
    const wrapper = mount(BackTop, {
      global: {
        stubs: { Teleport: true }
      }
    })
    expect(wrapper.find('.u-back-top__icon').exists()).toBe(true)
  })

  it('点击时应触发 click 事件', async () => {
    const wrapper = mount(BackTop, {
      global: {
        stubs: { Teleport: true }
      }
    })
    await wrapper.find('.u-back-top').trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('应该支持阴影选项', () => {
    const wrapper = mount(BackTop, {
      props: { shadow: true },
      global: {
        stubs: { Teleport: true }
      }
    })
    expect(wrapper.find('.u-back-top--shadow').exists()).toBe(true)
  })

  it('无阴影时不应有 shadow class', () => {
    const wrapper = mount(BackTop, {
      props: { shadow: false },
      global: {
        stubs: { Teleport: true }
      }
    })
    expect(wrapper.find('.u-back-top--shadow').exists()).toBe(false)
  })
})
