import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import Notification from '../components/Notification.vue'
import NotificationFn from '../methods'

describe('UNotification', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('renders with title and message', () => {
    const wrapper = mount(Notification, {
      props: { title: 'Test', message: 'Hello', type: 'info', duration: 0 },
    })
    expect(wrapper.find('.u-notification__title').text()).toBe('Test')
    expect(wrapper.find('.u-notification__content').text()).toBe('Hello')
  })

  it('applies type class and icon', () => {
    const wrapper = mount(Notification, {
      props: { title: 'OK', type: 'success', duration: 0 },
    })
    expect(wrapper.find('.u-notification--success').exists()).toBe(true)
    expect(wrapper.find('.u-notification__icon--success').exists()).toBe(true)
  })

  it('becomes visible on mount', async () => {
    const wrapper = mount(Notification, {
      props: { title: 'X', duration: 0 },
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.u-notification').isVisible()).toBe(true)
  })

  it('close sets visible to false and does NOT call onClose directly', async () => {
    const onClose = vi.fn()
    const wrapper = mount(Notification, {
      props: { title: 'X', duration: 0, onClose },
    })
    await wrapper.vm.$nextTick()
    wrapper.vm.close()
    await wrapper.vm.$nextTick()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('onClose fires only after leave transition (after-leave)', async () => {
    const onClose = vi.fn()
    const wrapper = mount(Notification, {
      props: { title: 'X', duration: 0, onClose },
    })
    await wrapper.vm.$nextTick()
    wrapper.vm.close()
    const transition = wrapper.findComponent({ name: 'Transition' })
    transition.vm.$emit('after-leave')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('exposes setOffset to update internal offset', async () => {
    const wrapper = mount(Notification, {
      props: { title: 'X', duration: 0, position: 'top-right', offset: 16 },
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.u-notification').attributes('style')).toContain('top: 16px')
    wrapper.vm.setOffset(100)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.u-notification').attributes('style')).toContain('top: 100px')
  })

  it('exposes incrementRepeat to increase badge count', async () => {
    const wrapper = mount(Notification, {
      props: { title: 'X', duration: 0 },
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.u-notification__badge').exists()).toBe(false)
    wrapper.vm.incrementRepeat()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.u-notification__badge').exists()).toBe(true)
    expect(wrapper.find('.u-notification__badge').text()).toBe('×2')
    wrapper.vm.incrementRepeat()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.u-notification__badge').text()).toBe('×3')
  })

  it('auto-closes after duration', async () => {
    const wrapper = mount(Notification, {
      props: { title: 'X', duration: 1000 },
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.u-notification').isVisible()).toBe(true)
    vi.advanceTimersByTime(1100)
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.u-notification').attributes('style')).toContain('display: none')
  })
})

describe('NotificationFn stacking', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('creates notification in DOM', () => {
    NotificationFn({ title: 'A', message: 'hello', duration: 0 })
    const el = document.querySelector('.u-notification')
    expect(el).toBeTruthy()
    expect(el?.textContent).toContain('A')
  })

  it('multiple notifications create separate containers', () => {
    NotificationFn({ title: 'A', duration: 0 })
    NotificationFn({ title: 'B', duration: 0 })
    const containers = document.querySelectorAll('.u-notification-container')
    expect(containers.length).toBe(2)
  })

  it('returns handler with close method', () => {
    const handler = NotificationFn({ title: 'A', duration: 0 })
    expect(typeof handler.close).toBe('function')
  })

  it('deduplicate merges same-content notifications instead of creating new ones', async () => {
    NotificationFn({ title: 'Dup', message: 'same', type: 'error', duration: 0, deduplicate: true })
    NotificationFn({ title: 'Dup', message: 'same', type: 'error', duration: 0, deduplicate: true })
    NotificationFn({ title: 'Dup', message: 'same', type: 'error', duration: 0, deduplicate: true })
    await nextTick()
    const containers = document.querySelectorAll('.u-notification-container')
    expect(containers.length).toBe(1)
    const badge = containers[0].querySelector('.u-notification__badge')
    expect(badge).toBeTruthy()
    expect(badge?.textContent).toBe('×3')
  })

  it('deduplicate=false (default) creates separate notifications', () => {
    NotificationFn({ title: 'A', message: 'same', duration: 0 })
    NotificationFn({ title: 'A', message: 'same', duration: 0 })
    const containers = document.querySelectorAll('.u-notification-container')
    expect(containers.length).toBe(2)
  })
})
