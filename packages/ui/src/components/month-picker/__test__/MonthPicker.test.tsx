import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UMonthPicker from '../src/MonthPicker.vue'
import type { UMonthPickerProps } from '../types'
import { UButton, USelect, UIcon } from '@/components'

const createWrapper = (props: Partial<UMonthPickerProps> = {}, options = {}) =>
  mount(UMonthPicker, {
    props: {
      year: 2025,
      month: 6,
      yearOptions: [2024, 2025],
      ...props,
    },
    global: {
      components: { UButton, USelect, UIcon },
    },
    ...options,
  })

describe('UMonthPicker', () => {
  it('renders and has u-month-picker class', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.classes()).toContain('u-month-picker')
  })

  it('renders two nav buttons and two selects', () => {
    const wrapper = createWrapper()
    const navWrap = wrapper.find('.u-month-picker__selects')
    expect(navWrap.exists()).toBe(true)
    const selects = wrapper.findAll('.u-select')
    expect(selects).toHaveLength(2)
    const buttons = wrapper.findAll('.u-button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  it('passes year and yearOptions to year select', () => {
    const wrapper = createWrapper({ year: 2024, yearOptions: [2023, 2024, 2025] })
    const selects = wrapper.findAllComponents(USelect)
    expect(selects[0].props('modelValue')).toBe(2024)
    expect(selects[0].props('options')).toEqual([
      { value: 2023, label: '2023' },
      { value: 2024, label: '2024' },
      { value: 2025, label: '2025' },
    ])
  })

  it('passes month and monthOptions to month select', () => {
    const wrapper = createWrapper({
      month: 12,
      monthOptions: [
        { value: 1, label: '1月' },
        { value: 12, label: '12月' },
      ],
    })
    const selects = wrapper.findAllComponents(USelect)
    expect(selects[1].props('modelValue')).toBe(12)
    expect(selects[1].props('options')).toHaveLength(2)
  })

  it('emits prev when first nav button clicked', async () => {
    const wrapper = createWrapper()
    const buttons = wrapper.findAll('.u-button')
    await buttons[0].trigger('click')
    expect(wrapper.emitted('prev')).toHaveLength(1)
  })

  it('emits next when second nav button clicked', async () => {
    const wrapper = createWrapper()
    const buttons = wrapper.findAll('.u-button')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('next')).toHaveLength(1)
  })

  it('emits update:year when year select changes', async () => {
    const wrapper = createWrapper()
    const selects = wrapper.findAllComponents(USelect)
    await selects[0].vm.$emit('update:modelValue', 2024)
    expect(wrapper.emitted('update:year')).toBeTruthy()
    expect(wrapper.emitted('update:year')![0]).toEqual([2024])
  })

  it('emits update:month when month select changes', async () => {
    const wrapper = createWrapper()
    const selects = wrapper.findAllComponents(USelect)
    await selects[1].vm.$emit('update:modelValue', 3)
    expect(wrapper.emitted('update:month')).toBeTruthy()
    expect(wrapper.emitted('update:month')![0]).toEqual([3])
  })

  it('disables next button when disableNext true', () => {
    const wrapper = createWrapper({ disableNext: true })
    const buttons = wrapper.findAll('.u-button')
    expect(buttons[1].attributes('disabled')).toBeDefined()
  })

  it('uses prevMonthAriaLabel and nextMonthAriaLabel', () => {
    const wrapper = createWrapper({
      prevMonthAriaLabel: 'Previous',
      nextMonthAriaLabel: 'Next',
    })
    const buttons = wrapper.findAll('.u-button')
    expect(buttons[0].attributes('aria-label')).toBe('Previous')
    expect(buttons[1].attributes('aria-label')).toBe('Next')
  })
})
