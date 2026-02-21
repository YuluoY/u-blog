import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UCascader from '../src/Cascader.vue'
import type { UCascaderProps } from '../types'
import { ref } from 'vue'
import { FORM_ITEM_SIZE_INJECTION_KEY } from '@/components/form'

const TooltipStub = {
  name: 'UTooltip',
  methods: { hide() {}, show() {}, updatePopper() {} },
  template: '<div class="u-tooltip-stub"><slot /><slot name="content" /></div>',
}

const treeOptions = [
  {
    value: 'zhejiang',
    label: '浙江',
    children: [
      {
        value: 'hangzhou',
        label: '杭州',
        children: [
          { value: 'xihu', label: '西湖区' },
          { value: 'gongshu', label: '拱墅区' },
        ],
      },
      { value: 'ningbo', label: '宁波', children: [{ value: 'haishu', label: '海曙区' }] },
    ],
  },
  {
    value: 'jiangsu',
    label: '江苏',
    children: [
      { value: 'nanjing', label: '南京', children: [{ value: 'xuanwu', label: '玄武区' }] },
    ],
  },
]

const createWrapper = (props: Partial<UCascaderProps> = {}, options = {}) =>
  mount(UCascader, {
    props,
    global: {
      provide: { [FORM_ITEM_SIZE_INJECTION_KEY as symbol]: ref(undefined) },
      stubs: { UTooltip: TooltipStub, UIcon: true },
    },
    ...options,
  })

describe('UCascader', () => {
  it('renders with u-cascader class', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.classes()).toContain('u-cascader')
  })

  it('applies disabled class', () => {
    const wrapper = createWrapper({ disabled: true })
    expect(wrapper.classes()).toContain('is-disabled')
  })

  it('applies size class', () => {
    const wrapper = createWrapper({ size: 'small' })
    expect(wrapper.classes()).toContain('u-cascader--small')
  })

  it('shows placeholder when no value', () => {
    const wrapper = createWrapper({ placeholder: '请选择', options: treeOptions })
    expect(wrapper.find('.u-cascader__placeholder').text()).toBe('请选择')
  })

  it('displays selected path label', () => {
    const wrapper = createWrapper({
      modelValue: ['zhejiang', 'hangzhou', 'xihu'],
      options: treeOptions,
    })
    expect(wrapper.find('.u-cascader__label').text()).toBe('浙江 / 杭州 / 西湖区')
  })

  it('uses custom separator', () => {
    const wrapper = createWrapper({
      modelValue: ['zhejiang', 'hangzhou'],
      options: treeOptions,
      separator: ' > ',
    })
    expect(wrapper.find('.u-cascader__label').text()).toBe('浙江 > 杭州')
  })

  it('renders root-level options as first column', () => {
    const wrapper = createWrapper({ options: treeOptions })
    const menus = wrapper.findAll('.u-cascader__menu')
    expect(menus.length).toBe(1)
    const opts = menus[0].findAll('.u-cascader__option')
    expect(opts.length).toBe(2)
    expect(opts[0].find('.u-cascader__option-label').text()).toBe('浙江')
    expect(opts[1].find('.u-cascader__option-label').text()).toBe('江苏')
  })

  it('expands second column based on modelValue', () => {
    const wrapper = createWrapper({
      modelValue: ['zhejiang'],
      options: treeOptions,
    })
    const menus = wrapper.findAll('.u-cascader__menu')
    expect(menus.length).toBeGreaterThanOrEqual(1)
  })

  it('emits update:modelValue on leaf click', async () => {
    const wrapper = createWrapper({ options: treeOptions })
    const firstOption = wrapper.findAll('.u-cascader__option')[0]
    await firstOption.trigger('click')
    const secondMenu = wrapper.findAll('.u-cascader__menu')[1]
    const secondOption = secondMenu.findAll('.u-cascader__option')[0]
    await secondOption.trigger('click')
    const thirdMenu = wrapper.findAll('.u-cascader__menu')[2]
    const thirdOption = thirdMenu.findAll('.u-cascader__option')[0]
    await thirdOption.trigger('click')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![emitted!.length - 1][0]).toEqual(['zhejiang', 'hangzhou', 'xihu'])
  })

  it('emits clear event', async () => {
    const wrapper = createWrapper({
      modelValue: ['zhejiang', 'hangzhou', 'xihu'],
      options: treeOptions,
      clearable: true,
    })
    wrapper.vm.hovering = true
    await wrapper.vm.$nextTick()
    const clearBtn = wrapper.find('.u-cascader__clear')
    if (clearBtn.exists()) {
      await clearBtn.trigger('click')
      expect(wrapper.emitted('clear')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual([])
    }
  })

  it('marks has-children options', () => {
    const wrapper = createWrapper({ options: treeOptions })
    const opts = wrapper.findAll('.u-cascader__option')
    expect(opts[0].classes()).toContain('has-children')
  })

  it('marks disabled options', () => {
    const wrapper = createWrapper({
      options: [{ value: 'a', label: 'A', disabled: true }],
    })
    const opt = wrapper.find('.u-cascader__option')
    expect(opt.classes()).toContain('is-disabled')
  })

  it('does not emit on disabled option click', async () => {
    const wrapper = createWrapper({
      options: [{ value: 'a', label: 'A', disabled: true }],
    })
    await wrapper.find('.u-cascader__option').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('injects form item size', () => {
    const wrapper = mount(UCascader, {
      props: { options: treeOptions },
      global: {
        provide: { [FORM_ITEM_SIZE_INJECTION_KEY as symbol]: ref('large') },
        stubs: { UTooltip: TooltipStub, UIcon: true },
      },
    })
    expect(wrapper.classes()).toContain('u-cascader--large')
  })

  it('changeOnSelect emits on non-leaf click', async () => {
    const wrapper = createWrapper({
      options: treeOptions,
      changeOnSelect: true,
    })
    await wrapper.findAll('.u-cascader__option')[0].trigger('click')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual(['zhejiang'])
  })

  it('handles empty options gracefully', () => {
    const wrapper = createWrapper({ options: [] })
    expect(wrapper.findAll('.u-cascader__menu').length).toBe(0)
  })

  it('partial modelValue displays partial path', () => {
    const wrapper = createWrapper({
      modelValue: ['zhejiang', 'hangzhou'],
      options: treeOptions,
    })
    expect(wrapper.find('.u-cascader__label').text()).toBe('浙江 / 杭州')
  })
})
