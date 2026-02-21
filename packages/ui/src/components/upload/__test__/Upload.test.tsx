import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import UUpload from '../src/Upload.vue'
import type { UUploadProps } from '../types'

const createWrapper = (props: Partial<UUploadProps> = {}) =>
  mount(UUpload, {
    props,
    global: {
      stubs: { UIcon: true },
    },
  })

describe('UUpload', () => {
  it('renders with u-upload class', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.u-upload').exists()).toBe(true)
  })

  it('applies picture-card modifier by default', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.u-upload--picture-card').exists()).toBe(true)
  })

  it('shows dragger when no modelValue', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.u-upload__dragger').exists()).toBe(true)
    expect(wrapper.find('.u-upload__card').exists()).toBe(false)
  })

  it('shows preview card when modelValue is set', () => {
    const wrapper = createWrapper({ modelValue: 'data:image/png;base64,abc' })
    expect(wrapper.find('.u-upload__card').exists()).toBe(true)
    expect(wrapper.find('.u-upload__dragger').exists()).toBe(false)
  })

  it('renders preview image with correct src and fit', () => {
    const wrapper = createWrapper({
      modelValue: 'https://example.com/img.jpg',
      fit: 'contain',
    })
    const img = wrapper.find('.u-upload__card-img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example.com/img.jpg')
    expect((img.element as HTMLImageElement).style.objectFit).toBe('contain')
  })

  it('applies disabled class', () => {
    const wrapper = createWrapper({ disabled: true })
    expect(wrapper.find('.is-disabled').exists()).toBe(true)
  })

  it('hides file input', () => {
    const wrapper = createWrapper()
    const input = wrapper.find('.u-upload__input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('type')).toBe('file')
  })

  it('sets accept attribute on file input', () => {
    const wrapper = createWrapper({ accept: 'image/png,image/jpeg' })
    const input = wrapper.find('.u-upload__input')
    expect(input.attributes('accept')).toBe('image/png,image/jpeg')
  })

  it('applies aspect-ratio style to dragger', () => {
    const wrapper = createWrapper({ aspectRatio: '4/3' })
    const dragger = wrapper.find('.u-upload__dragger')
    expect(dragger.attributes('style')).toContain('aspect-ratio: 4/3')
  })

  it('emits remove and update:modelValue on delete click', async () => {
    const wrapper = createWrapper({ modelValue: 'data:image/png;base64,abc' })
    await wrapper.find('.u-upload__card-action--danger').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
    expect(wrapper.emitted('remove')).toHaveLength(1)
  })

  it('triggers file input on dragger click', async () => {
    const wrapper = createWrapper()
    const input = wrapper.find('.u-upload__input')
    const clickSpy = vi.spyOn(input.element as HTMLInputElement, 'click')
    await wrapper.find('.u-upload__dragger').trigger('click')
    expect(clickSpy).toHaveBeenCalled()
  })

  it('does not trigger file input when disabled', async () => {
    const wrapper = createWrapper({ disabled: true })
    const input = wrapper.find('.u-upload__input')
    const clickSpy = vi.spyOn(input.element as HTMLInputElement, 'click')
    await wrapper.find('.u-upload__dragger').trigger('click')
    expect(clickSpy).not.toHaveBeenCalled()
  })

  it('emits exceed when file exceeds maxSize', async () => {
    const wrapper = createWrapper({ maxSize: 1 })
    const bigFile = new File(['x'.repeat(2 * 1024 * 1024)], 'big.png', { type: 'image/png' })
    const input = wrapper.find('.u-upload__input')
    Object.defineProperty(input.element, 'files', { value: [bigFile], writable: false })
    await input.trigger('change')
    expect(wrapper.emitted('exceed')?.[0]?.[0]).toBe(bigFile)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('reads file as base64 on valid file input', async () => {
    const wrapper = createWrapper({ maxSize: 10 })
    const file = new File(['hello'], 'test.png', { type: 'image/png' })
    const input = wrapper.find('.u-upload__input')
    Object.defineProperty(input.element, 'files', { value: [file], writable: false })

    const readAsDataURLSpy = vi.spyOn(FileReader.prototype, 'readAsDataURL')
    await input.trigger('change')
    expect(readAsDataURLSpy).toHaveBeenCalledWith(file)
    readAsDataURLSpy.mockRestore()
  })

  it('renders tip slot content', () => {
    const wrapper = mount(UUpload, {
      global: { stubs: { UIcon: true } },
      slots: { tip: '<span class="test-tip">Max 5MB</span>' },
    })
    expect(wrapper.find('.u-upload__tip').exists()).toBe(true)
    expect(wrapper.find('.test-tip').text()).toBe('Max 5MB')
  })

  it('does not render tip when no tip slot', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.u-upload__tip').exists()).toBe(false)
  })

  it('shows action buttons on card when not disabled', () => {
    const wrapper = createWrapper({ modelValue: 'img.jpg' })
    const actions = wrapper.findAll('.u-upload__card-action')
    expect(actions.length).toBe(2)
  })

  it('hides action buttons on card when disabled', () => {
    const wrapper = createWrapper({ modelValue: 'img.jpg', disabled: true })
    const actions = wrapper.findAll('.u-upload__card-action')
    expect(actions.length).toBe(0)
  })

  it('sets dragover class on dragover', async () => {
    const wrapper = createWrapper()
    const dragger = wrapper.find('.u-upload__dragger')
    await dragger.trigger('dragover')
    expect(dragger.classes()).toContain('is-dragover')
  })

  it('removes dragover class on dragleave', async () => {
    const wrapper = createWrapper()
    const dragger = wrapper.find('.u-upload__dragger')
    await dragger.trigger('dragover')
    expect(dragger.classes()).toContain('is-dragover')
    await dragger.trigger('dragleave')
    expect(dragger.classes()).not.toContain('is-dragover')
  })

  it('exposes openFileDialog and clear methods', () => {
    const wrapper = createWrapper()
    expect(typeof wrapper.vm.openFileDialog).toBe('function')
    expect(typeof wrapper.vm.clear).toBe('function')
  })
})
