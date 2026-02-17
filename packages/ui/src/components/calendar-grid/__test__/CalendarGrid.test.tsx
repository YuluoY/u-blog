import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import UCalendarGrid from '../src/CalendarGrid.vue'
const createWrapper = (props = {}, options = {}) =>
  mount(UCalendarGrid, {
    props: {
      dayLabels: ['日', '一', '二', '三', '四', '五', '六'],
      cells: [
        null,
        null,
        { day: 1, dateStr: '2025-02-01' },
        { day: 2, dateStr: '2025-02-02' },
      ],
      ...props,
    },
    ...options,
  })

describe('UCalendarGrid', () => {
  it('renders and has u-calendar-grid class', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.classes()).toContain('u-calendar-grid')
  })

  it('renders 7 day label cells', () => {
    const wrapper = createWrapper()
    const heads = wrapper.findAll('.u-calendar-grid__cell--head')
    expect(heads).toHaveLength(7)
    expect(heads[0].text()).toBe('日')
    expect(heads[6].text()).toBe('六')
  })

  it('renders day cells and placeholders', () => {
    const wrapper = createWrapper()
    const dayCells = wrapper.findAll('.u-calendar-grid__cell--day')
    expect(dayCells).toHaveLength(2)
    expect(dayCells[0].text()).toContain('1')
    expect(dayCells[1].text()).toContain('2')
    const allCells = wrapper.findAll('.u-calendar-grid__cell')
    expect(allCells.length).toBe(7 + 2 + 2)
  })

  it('applies is-selected when selectedDate matches cell', () => {
    const wrapper = createWrapper({ selectedDate: '2025-02-01' })
    const dayCells = wrapper.findAll('.u-calendar-grid__cell--day')
    expect(dayCells[0].classes()).toContain('is-selected')
    expect(dayCells[1].classes()).not.toContain('is-selected')
  })

  it('applies has-posts when dayCountMap has count > 0', () => {
    const wrapper = createWrapper({
      dayCountMap: { '2025-02-02': 3 },
    })
    const dayCells = wrapper.findAll('.u-calendar-grid__cell--day')
    expect(dayCells[1].classes()).toContain('has-posts')
  })

  it('calls onSelectDay with dateStr when day cell clicked', async () => {
    const onSelectDay = vi.fn()
    const wrapper = createWrapper({ onSelectDay })
    const firstDay = wrapper.findAll('.u-calendar-grid__cell--day')[0]
    await firstDay.trigger('click')
    expect(onSelectDay).toHaveBeenCalledWith('2025-02-01')
  })

  it('sets aria-label on root', () => {
    const wrapper = createWrapper({ ariaLabel: '月历' })
    expect(wrapper.attributes('aria-label')).toBe('月历')
  })
})
