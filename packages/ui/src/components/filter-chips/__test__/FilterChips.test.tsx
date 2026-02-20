import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { UFilterChips } from '..'

const createWrapper = (props: any = {}) =>
  mount(UFilterChips, {
    props: {
      label: 'Filters',
      chips: [{ key: '1', label: 'Tag1' }],
      clearText: 'Clear',
      ...props
    }
  })

describe('UFilterChips', () => {
  it('renders with u-filter-chips class', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.u-filter-chips').exists()).toBe(true)
  })

  it('renders label when provided', () => {
    const wrapper = createWrapper({ label: 'Current' })
    expect(wrapper.text()).toContain('Current')
  })

  it('renders clear button when clearText provided', () => {
    const wrapper = createWrapper({ clearText: 'Clear all' })
    expect(wrapper.text()).toContain('Clear all')
  })

  it('emits clear when clear button clicked', async () => {
    const wrapper = createWrapper()
    await wrapper.find('.u-filter-chips__clear').trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('does not render clear when clearText empty', () => {
    const wrapper = createWrapper({ clearText: '' })
    expect(wrapper.find('.u-filter-chips__clear').exists()).toBe(false)
  })
})
