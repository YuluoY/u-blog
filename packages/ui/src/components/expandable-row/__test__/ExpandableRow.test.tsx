import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { UExpandableRow } from '..'

const createWrapper = (props: any = {}, slots: any = {}) =>
  mount(UExpandableRow, {
    props: { open: false, ...props },
    slots: {
      summary: '<span class="summary">Summary</span>',
      default: '<div class="expand-content">Expand</div>',
      ...slots
    }
  })

describe('UExpandableRow', () => {
  it('renders with u-expandable-row class', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.u-expandable-row').exists()).toBe(true)
  })

  it('renders summary slot', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.u-expandable-row__line .summary').exists()).toBe(true)
    expect(wrapper.find('.summary').text()).toBe('Summary')
  })

  it('wrap has is-open when open is true', () => {
    const wrapper = createWrapper({ open: true })
    expect(wrapper.find('.u-expandable-row__wrap.is-open').exists()).toBe(true)
  })

  it('wrap does not have is-open when open is false', () => {
    const wrapper = createWrapper({ open: false })
    expect(wrapper.find('.u-expandable-row__wrap.is-open').exists()).toBe(false)
  })
})
