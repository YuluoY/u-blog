// UCollapse.spec.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { UCollapse, UCollapseItem } from '../index'
import type { UCollapseProps } from '../types'

describe('UCollapse 组件', () =>
{
  it('默认渲染正确', () =>
  {
    const wrapper = mount(UCollapse)
    expect(wrapper.exists()).toBe(true)
  })

  it('渲染 modelValue 正确', () =>
  {
    const wrapper = mount(UCollapse, {
      props: {
        modelValue: ['item1', 'item2']
      } as UCollapseProps,
      slots: {
        default: `
          <UCollapseItem name="item1" title="Item 1" />
          <UCollapseItem name="item2" title="Item 2" />
        `,
      },
      global: {
        components: { UCollapseItem },
      },
    })

    const items = wrapper.findAll('.u-collapse-item')
    expect(items.length).toBe(2)
    expect(items[0].classes()).toContain('is-active')
    expect(items[1].classes()).toContain('is-active')
  })

  it('手风琴模式渲染正确', async() =>
  {
    const wrapper = mount(UCollapse, {
      props: {
        accordion: true,
        modelValue: ['item1']
      } as UCollapseProps,
      slots: {
        default: `
          <UCollapseItem name="item1" title="Item 1" />
          <UCollapseItem name="item2" title="Item 2" />
        `,
      },
      global: {
        components: { UCollapseItem },
      },
    })

    await wrapper.findAll('.u-collapse-item__header')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0][0]).toEqual(['item2'])
  })

  it('点击触发 change 事件', async() =>
  {
    const wrapper = mount(UCollapse, {
      props: {
        modelValue: ['item1']
      } as UCollapseProps,
      slots: {
        default: `
          <UCollapseItem name="item1" title="Item 1" />
          <UCollapseItem name="item2" title="Item 2" />
        `,
      },
      global: {
        components: { UCollapseItem },
      },
    })

    await wrapper.findAll('.u-collapse-item__header')[1].trigger('click')
    expect(wrapper.emitted('change')).toBeTruthy()
  })

  it('禁用状态渲染正确', () =>
  {
    const wrapper = mount(UCollapse, {
      slots: {
        default: `
          <UCollapseItem name="item1" title="Item 1" disabled />
        `,
      },
      global: {
        components: { UCollapseItem },
      },
    })

    const item = wrapper.find('.u-collapse-item')
    expect(item.classes()).toContain('is-disabled')
    item.find('.u-collapse-item__header').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('自定义图标渲染正确', () =>
  {
    const wrapper = mount(UCollapse, {
      slots: {
        default: `
          <UCollapseItem name="item1" title="Item 1" :iconProps="{ icon: 'check' }" />
        `,
      },
      global: {
        components: { UCollapseItem },
      },
    })

    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.classes()).toContain('fa-check')
  })
})
