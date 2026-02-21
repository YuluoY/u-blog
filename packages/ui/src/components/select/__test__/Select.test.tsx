import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import USelect from '../src/Select.vue'
import type { USelectProps } from '../types'
import { ref } from 'vue'
import { FORM_ITEM_SIZE_INJECTION_KEY } from '@/components/form'

const TooltipStub = {
  name: 'UTooltip',
  methods: { hide() {}, show() {} },
  template: '<div class="u-tooltip-stub"><slot /><slot name="content" /></div>',
}

const createWrapper = (props: Partial<USelectProps> = {}, options = {}) =>
  mount(USelect, {
    props,
    global: {
      provide: { [FORM_ITEM_SIZE_INJECTION_KEY as symbol]: ref(undefined) },
      stubs: { UTooltip: TooltipStub, UIcon: true, UTag: true },
    },
    ...options,
  })

describe('USelect', () => {
  it('renders with u-select class', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.classes()).toContain('u-select')
  })

  it('applies disabled class', () => {
    const wrapper = createWrapper({ disabled: true })
    expect(wrapper.classes()).toContain('is-disabled')
  })

  it('applies size class', () => {
    const wrapper = createWrapper({ size: 'small' })
    expect(wrapper.classes()).toContain('u-select--small')
  })

  it('shows placeholder when no value', () => {
    const wrapper = createWrapper({ placeholder: '请选择', options: [{ value: 1, label: 'A' }] })
    expect(wrapper.find('.u-select__placeholder').text()).toBe('请选择')
  })

  it('displays selected label for single select', () => {
    const wrapper = createWrapper({
      modelValue: 'b',
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
    })
    expect(wrapper.find('.u-select__label').text()).toBe('B')
  })

  it('renders options in dropdown', () => {
    const wrapper = createWrapper({
      options: [
        { value: 'a', label: 'Alpha' },
        { value: 'b', label: 'Beta' },
      ],
    })
    const opts = wrapper.findAll('.u-select__option')
    expect(opts).toHaveLength(2)
    expect(opts[0].text()).toContain('Alpha')
    expect(opts[1].text()).toContain('Beta')
  })

  it('normalizes primitive options', () => {
    const wrapper = createWrapper({ options: [1, 2, 3] })
    const opts = wrapper.findAll('.u-select__option')
    expect(opts).toHaveLength(3)
    expect(opts[0].text()).toContain('1')
  })

  it('marks selected option with is-selected', () => {
    const wrapper = createWrapper({
      modelValue: 'a',
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
    })
    expect(wrapper.findAll('.u-select__option')[0].classes()).toContain('is-selected')
    expect(wrapper.findAll('.u-select__option')[1].classes()).not.toContain('is-selected')
  })

  it('emits update:modelValue and change on option click (single)', async () => {
    const wrapper = createWrapper({
      modelValue: 'a',
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
    })
    await wrapper.findAll('.u-select__option')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['b'])
  })

  describe('multiple mode', () => {
    it('adds is-multiple class', () => {
      const wrapper = createWrapper({ multiple: true })
      expect(wrapper.classes()).toContain('is-multiple')
    })

    it('renders tags for selected values', () => {
      const wrapper = createWrapper({
        multiple: true,
        modelValue: [1, 2],
        options: [
          { value: 1, label: 'One' },
          { value: 2, label: 'Two' },
          { value: 3, label: 'Three' },
        ],
      })
      const tags = wrapper.findAll('.u-select__tag')
      expect(tags).toHaveLength(2)
    })

    it('shows placeholder when no tags selected', () => {
      const wrapper = createWrapper({
        multiple: true,
        modelValue: [],
        placeholder: '请选择标签',
        options: [{ value: 1, label: 'One' }],
      })
      expect(wrapper.find('.u-select__placeholder').text()).toBe('请选择标签')
    })

    it('toggles selection on click', async () => {
      const wrapper = createWrapper({
        multiple: true,
        modelValue: [1],
        options: [
          { value: 1, label: 'One' },
          { value: 2, label: 'Two' },
        ],
      })
      await wrapper.findAll('.u-select__option')[1].trigger('click')
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[1, 2]])

      await wrapper.findAll('.u-select__option')[0].trigger('click')
      expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([[]])
    })

    it('shows all tags even when count exceeds maxTagCount (wraps instead)', () => {
      const wrapper = createWrapper({
        multiple: true,
        modelValue: [1, 2, 3],
        maxTagCount: 1,
        options: [
          { value: 1, label: 'One' },
          { value: 2, label: 'Two' },
          { value: 3, label: 'Three' },
        ],
      })
      const tags = wrapper.findAll('.u-select__tag')
      expect(tags).toHaveLength(3)
      expect(wrapper.find('.u-select__tag-collapse').exists()).toBe(false)
    })

    it('marks multiple options with check icon', () => {
      const wrapper = createWrapper({
        multiple: true,
        modelValue: [1],
        options: [
          { value: 1, label: 'One' },
          { value: 2, label: 'Two' },
        ],
      })
      const options = wrapper.findAll('.u-select__option')
      expect(options[0].classes()).toContain('is-selected')
      expect(options[0].classes()).toContain('is-multiple')
      expect(options[1].classes()).not.toContain('is-selected')
    })
  })

  describe('clearable', () => {
    it('does not show clear button by default', () => {
      const wrapper = createWrapper({
        modelValue: 'a',
        options: [{ value: 'a', label: 'A' }],
      })
      expect(wrapper.find('.u-select__clear').exists()).toBe(false)
    })

    it('shows clear button on hover when clearable and has value', async () => {
      const wrapper = createWrapper({
        modelValue: 'a',
        clearable: true,
        options: [{ value: 'a', label: 'A' }],
      })
      await wrapper.trigger('mouseenter')
      expect(wrapper.find('.u-select__clear').exists()).toBe(true)
    })

    it('hides clear button when not hovering', async () => {
      const wrapper = createWrapper({
        modelValue: 'a',
        clearable: true,
        options: [{ value: 'a', label: 'A' }],
      })
      await wrapper.trigger('mouseenter')
      expect(wrapper.find('.u-select__clear').exists()).toBe(true)
      await wrapper.trigger('mouseleave')
      expect(wrapper.find('.u-select__clear').exists()).toBe(false)
    })

    it('does not show clear button when no value', async () => {
      const wrapper = createWrapper({
        modelValue: '',
        clearable: true,
        options: [{ value: 'a', label: 'A' }],
      })
      await wrapper.trigger('mouseenter')
      expect(wrapper.find('.u-select__clear').exists()).toBe(false)
    })

    it('emits clear and update:modelValue on clear click (single)', async () => {
      const wrapper = createWrapper({
        modelValue: 'a',
        clearable: true,
        options: [{ value: 'a', label: 'A' }],
      })
      await wrapper.trigger('mouseenter')
      await wrapper.find('.u-select__clear').trigger('click')
      expect(wrapper.emitted('clear')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
    })

    it('clears all selections in multi mode', async () => {
      const wrapper = createWrapper({
        multiple: true,
        modelValue: [1, 2],
        clearable: true,
        options: [
          { value: 1, label: 'One' },
          { value: 2, label: 'Two' },
        ],
      })
      await wrapper.trigger('mouseenter')
      await wrapper.find('.u-select__clear').trigger('click')
      expect(wrapper.emitted('clear')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[]])
    })
  })

  describe('single select placeholder', () => {
    it('shows .u-select__label when value is selected', () => {
      const wrapper = createWrapper({
        modelValue: 'a',
        placeholder: '请选择',
        options: [{ value: 'a', label: 'A' }],
      })
      expect(wrapper.find('.u-select__label').exists()).toBe(true)
      expect(wrapper.find('.u-select__placeholder').exists()).toBe(false)
    })

    it('shows .u-select__placeholder when no value', () => {
      const wrapper = createWrapper({
        placeholder: '请选择',
        options: [{ value: 'a', label: 'A' }],
      })
      expect(wrapper.find('.u-select__label').exists()).toBe(false)
      expect(wrapper.find('.u-select__placeholder').exists()).toBe(true)
    })
  })
})
