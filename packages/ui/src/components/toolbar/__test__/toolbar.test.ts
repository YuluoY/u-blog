import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Toolbar from '../src/Toolbar.vue'

describe('UToolbar', () => {
  const actions = [
    { key: 'bold', label: 'Bold', icon: 'fa-solid fa-bold' },
    { key: 'italic', label: 'Italic' },
    { key: 'del', label: 'Delete', disabled: true },
    { key: 'hidden', label: 'Hidden', hidden: true },
  ]

  it('renders visible actions', () => {
    const wrapper = mount(Toolbar, { props: { actions } })
    const btns = wrapper.findAll('.u-toolbar__btn')
    expect(btns).toHaveLength(3)
    expect(btns[0].text()).toContain('Bold')
    expect(btns[1].text()).toContain('Italic')
    expect(btns[2].text()).toContain('Delete')
  })

  it('hides actions with hidden=true', () => {
    const wrapper = mount(Toolbar, { props: { actions } })
    const labels = wrapper.findAll('.u-toolbar__btn').map((b) => b.text())
    expect(labels).not.toContain('Hidden')
  })

  it('emits action event on button click', async () => {
    const wrapper = mount(Toolbar, { props: { actions } })
    await wrapper.findAll('.u-toolbar__btn')[1].trigger('click')
    expect(wrapper.emitted('action')).toEqual([['italic']])
  })

  it('does not emit action for disabled button', async () => {
    const wrapper = mount(Toolbar, { props: { actions } })
    await wrapper.findAll('.u-toolbar__btn')[2].trigger('click')
    expect(wrapper.emitted('action')).toBeUndefined()
  })

  it('shows loading state', () => {
    const wrapper = mount(Toolbar, {
      props: { actions, loading: true, loadingText: 'Working...' },
    })
    expect(wrapper.find('.u-toolbar__loading').exists()).toBe(true)
    expect(wrapper.find('.u-toolbar__loading').text()).toContain('Working...')
    expect(wrapper.find('.u-toolbar__actions').exists()).toBe(false)
  })

  it('applies size modifier class', () => {
    const small = mount(Toolbar, { props: { actions, size: 'small' as const } })
    expect(small.find('.u-toolbar').classes()).toContain('u-toolbar--small')

    const large = mount(Toolbar, { props: { actions, size: 'large' as const } })
    expect(large.find('.u-toolbar').classes()).toContain('u-toolbar--large')
  })

  it('applies vertical direction class', () => {
    const wrapper = mount(Toolbar, {
      props: { actions, direction: 'vertical' as const },
    })
    expect(wrapper.find('.u-toolbar').classes()).toContain('u-toolbar--vertical')
  })

  it('does not apply modifier for default size', () => {
    const wrapper = mount(Toolbar, { props: { actions } })
    expect(wrapper.find('.u-toolbar').classes()).not.toContain('u-toolbar--default')
  })

  it('renders prepend and append slots', () => {
    const wrapper = mount(Toolbar, {
      props: { actions: [] },
      slots: {
        prepend: '<span class="test-prepend">P</span>',
        append: '<span class="test-append">A</span>',
      },
    })
    expect(wrapper.find('.test-prepend').exists()).toBe(true)
    expect(wrapper.find('.test-append').exists()).toBe(true)
  })

  it('renders custom default slot content', () => {
    const wrapper = mount(Toolbar, {
      props: { actions: [] },
      slots: {
        default: '<div class="custom-content">Custom</div>',
      },
    })
    expect(wrapper.find('.custom-content').exists()).toBe(true)
    expect(wrapper.findAll('.u-toolbar__btn')).toHaveLength(0)
  })
})
