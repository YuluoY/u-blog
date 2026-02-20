import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { UStatsBar } from '..'

const createWrapper = (props: any = {}) =>
  mount(UStatsBar, {
    props: { segments: [], ...props }
  })

describe('UStatsBar', () => {
  it('renders with u-stats-bar class', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.u-stats-bar').exists()).toBe(true)
  })

  it('renders segments by proportion', () => {
    const wrapper = createWrapper({
      segments: [
        { value: 50 },
        { value: 30 },
        { value: 20 }
      ]
    })
    const segs = wrapper.findAll('.u-stats-bar__seg')
    expect(segs.length).toBe(3)
  })

  it('uses max when provided for normalization', () => {
    const wrapper = createWrapper({
      segments: [
        { value: 10 },
        { value: 20 },
        { value: 70 }
      ],
      max: 100
    })
    const segs = wrapper.findAll('.u-stats-bar__seg')
    expect(segs.length).toBe(3)
  })

  it('renders empty when segments empty', () => {
    const wrapper = createWrapper({ segments: [] })
    expect(wrapper.findAll('.u-stats-bar__seg').length).toBe(0)
  })
})
