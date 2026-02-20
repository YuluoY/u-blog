import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { UTabs, UTabPane } from '..'

const createWrapper = (props: Record<string, unknown> = {}, slots: Record<string, string> = {}) => {
  return mount(UTabs, {
    props: { ...props },
    slots,
    global: { components: { UTabPane } }
  })
}

describe('UTabs', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders tab list from tabs prop', async () => {
    const wrapper = createWrapper({
      tabs: [
        { key: 'a', label: 'Tab A' },
        { key: 'b', label: 'Tab B' }
      ]
    })
    await nextTick()
    const headers = wrapper.findAll('.u-tabs__tab')
    expect(headers.length).toBe(2)
    expect(headers[0].text()).toBe('Tab A')
    expect(headers[1].text()).toBe('Tab B')
  })

  it('activates first tab by default', async () => {
    const wrapper = createWrapper({
      tabs: [
        { key: 'a', label: 'A' },
        { key: 'b', label: 'B' }
      ]
    })
    await nextTick()
    expect(wrapper.find('.u-tabs__tab.is-active').text()).toBe('A')
  })

  it('emits update:modelValue and tab-change on tab click', async () => {
    const wrapper = createWrapper({
      tabs: [
        { key: 'a', label: 'A' },
        { key: 'b', label: 'B' }
      ]
    })
    await nextTick()
    await wrapper.findAll('.u-tabs__tab')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b'])
    expect(wrapper.emitted('tab-change')?.[0]).toEqual(['b'])
  })

  it('respects modelValue for controlled active key', async () => {
    const wrapper = createWrapper({
      modelValue: 'b',
      tabs: [
        { key: 'a', label: 'A' },
        { key: 'b', label: 'B' }
      ]
    })
    await nextTick()
    expect(wrapper.find('.u-tabs__tab.is-active').text()).toBe('B')
  })

  it('renders content slot', async () => {
    const wrapper = createWrapper(
      {
        tabs: [
          { key: 'a', label: 'A' },
          { key: 'b', label: 'B' }
        ]
      },
      { default: '<div class="tab-content">Content</div>' }
    )
    await nextTick()
    expect(wrapper.find('.tab-content').text()).toBe('Content')
  })
})
