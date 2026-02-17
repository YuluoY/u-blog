import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import USelect from '../src/Select.vue'
import type { USelectProps } from '../types'
import { ref } from 'vue'
import { FORM_ITEM_SIZE_INJECTION_KEY } from '@/components/form'

const createWrapper = (props: Partial<USelectProps> = {}, options = {}) =>
  mount(USelect, {
    props,
    global: {
      provide: { [FORM_ITEM_SIZE_INJECTION_KEY as symbol]: ref(undefined) },
    },
    ...options,
  })

describe('USelect', () => {
  it('renders and has u-select class', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.classes()).toContain('u-select')
  })

  it('renders options from options array', () => {
    const wrapper = createWrapper({
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
    })
    const opts = wrapper.findAll('option')
    expect(opts).toHaveLength(2)
    expect(opts[0].text()).toBe('A')
    expect(opts[1].text()).toBe('B')
  })

  it('renders options from primitive array', () => {
    const wrapper = createWrapper({ options: [1, 2, 3] })
    const opts = wrapper.findAll('option')
    expect(opts).toHaveLength(3)
    expect(opts[0].text()).toBe('1')
  })

  it('shows placeholder option when placeholder prop set', () => {
    const wrapper = createWrapper({
      placeholder: '请选择',
      options: [{ value: 1, label: 'One' }],
    })
    const opts = wrapper.findAll('option')
    expect(opts[0].attributes('value')).toBe('')
    expect(opts[0].text()).toBe('请选择')
    expect(opts[0].attributes('disabled')).toBeDefined()
  })

  it('binds modelValue to select value', async () => {
    const wrapper = createWrapper({
      modelValue: 'b',
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
    })
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('b')
  })

  it('emits update:modelValue and change on select change', async () => {
    const wrapper = createWrapper({
      modelValue: 'a',
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
    })
    await wrapper.find('select').setValue('b')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['b'])
    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')![0]).toEqual(['b'])
  })

  it('applies disabled class and disables select when disabled', () => {
    const wrapper = createWrapper({ disabled: true })
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.find('select').attributes('disabled')).toBeDefined()
  })

  it('applies size class', () => {
    const wrapper = createWrapper({ size: 'small' })
    expect(wrapper.classes()).toContain('u-select--small')
  })
})
