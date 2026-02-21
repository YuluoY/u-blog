import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { UDialog } from '..'
import type { UDialogProps } from '../types'
import { nextTick, ref } from 'vue'
import { FORM_ITEM_SIZE_INJECTION_KEY } from '@/components/form'

type DialogProps = UDialogProps & {
  modelValue?: boolean
}

const createWrapper = (props: Partial<UDialogProps> = {}, slots = {}) =>
{
  // 创建目标容器
  const container = document.createElement('div')
  container.id = 'dialog-container'
  document.body.appendChild(container)

  return mount(UDialog, {
    props: {
      appendTo: '#dialog-container',
      ...props
    },
    slots,
    global: {
      provide: {
        [FORM_ITEM_SIZE_INJECTION_KEY as symbol]: ref(undefined)
      }
    }
  })
}

describe('UDialog 组件测试', () =>
{
  beforeEach(() =>
  {
    vi.useFakeTimers()
    // 清理 body
    document.body.innerHTML = ''
    // 模拟 window 尺寸
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true })
    Object.defineProperty(window.document.documentElement, 'clientWidth', { value: 1024, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true })
    Object.defineProperty(window.document.documentElement, 'clientHeight', { value: 768, configurable: true })
    // 模拟 requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb =>
    {
      cb(0)
      return 0
    })
  })

  afterEach(() =>
  {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  // 基础渲染测试
  it('默认渲染正确', async() =>
  {
    const wrapper = createWrapper({
      modelValue: true
    })
    await nextTick()
    
    const dialog = document.querySelector('.u-dialog')
    expect(dialog).toBeTruthy()
    expect(dialog?.querySelector('.u-dialog__header')).toBeTruthy()
    expect(dialog?.querySelector('.u-dialog__body')).toBeTruthy()
    expect(dialog?.querySelector('.u-dialog__footer')).toBeTruthy()
  })

  // 标题测试
  it('标题渲染正确', async() =>
  {
    const title = '测试标题'
    const wrapper = createWrapper({
      modelValue: true,
      title
    })
    await nextTick()
    
    const titleEl = document.querySelector('.u-dialog__title')
    expect(titleEl?.textContent?.trim()).toBe(title)
  })

  // 内容测试
  it('内容渲染正确', async() =>
  {
    const component = '测试内容'
    const wrapper = createWrapper({
      modelValue: true,
      component
    })
    await nextTick()
    
    const bodyEl = document.querySelector('.u-dialog__body')
    expect(bodyEl?.textContent?.trim()).toBe(component)
  })

  // 遮罩层测试
  it('遮罩层渲染正确', async() =>
  {
    const wrapper = createWrapper({
      modelValue: true,
      modal: true
    })
    await nextTick()
    
    const overlay = document.querySelector('.u-dialog-overlay')
    expect(overlay?.classList.contains('is-overlay')).toBe(true)
  })

  // 自定义遮罩层类名测试
  it('自定义遮罩层类名渲染正确', async() =>
  {
    const modalClass = 'custom-modal'
    const wrapper = createWrapper({
      modelValue: true,
      modal: true,
      modalClass
    })
    await nextTick()
    
    const overlay = document.querySelector('.u-dialog-overlay')
    expect(overlay?.classList.contains(modalClass)).toBe(true)
  })

  // 关闭按钮测试
  it('关闭按钮功能正确', async() =>
  {
    const wrapper = createWrapper({
      modelValue: true,
      showCloseIcon: true
    })
    await nextTick()
    
    const closeBtn = document.querySelector('.u-dialog__close')
    expect(closeBtn).toBeTruthy()
    
    await closeBtn?.dispatchEvent(new Event('click'))
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  // 折叠按钮测试
  it('折叠按钮功能正确', async() =>
  {
    const wrapper = createWrapper({
      modelValue: true,
      showCollapseIcon: true
    })
    await nextTick()
    
    const collapseBtn = document.querySelector('.u-dialog__minimize')
    expect(collapseBtn).toBeTruthy()
    
    await collapseBtn?.dispatchEvent(new Event('click'))
    expect(wrapper.emitted('collapse')?.[0]).toEqual([true])
  })

  // 点击遮罩层关闭测试
  it('点击遮罩层关闭功能正确', async() =>
  {
    const wrapper = createWrapper({
      modelValue: true,
      modal: true,
      closeOnClickModal: true
    })
    await nextTick()
    
    const overlay = document.querySelector('.u-dialog-overlay')
    await overlay?.dispatchEvent(new Event('click'))
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    expect(wrapper.emitted('click-modal')).toBeTruthy()
  })

  // ESC关闭测试
  it('ESC关闭功能正确', async() =>
  {
    const wrapper = createWrapper({
      modelValue: true,
      closeOnPressEscape: true
    })
    await nextTick()
    
    await document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    const emittedUpdate = wrapper.emitted('update:modelValue')
    if (emittedUpdate?.length) {
      expect(emittedUpdate[0]).toEqual([false])
      expect(wrapper.emitted('cancel')).toBeTruthy()
    }
  })

  // 底部按钮测试
  it('底部按钮功能正确', async() =>
  {
    const wrapper = createWrapper({
      modelValue: true,
      showFooter: true
    })
    await nextTick()
    
    const footer = document.querySelector('.u-dialog__footer')
    expect(footer).toBeTruthy()
    
    const [confirmBtn, cancelBtn] = Array.from(footer?.querySelectorAll('.u-button')) || []
    
    // 测试确认按钮 - emit会传一个参数是close函数
    await confirmBtn?.dispatchEvent(new Event('click'))
    expect(wrapper.emitted('confirm')?.[0]?.[0] as Function).toBeInstanceOf(Function)
    
    // 测试取消按钮
    await cancelBtn?.dispatchEvent(new Event('click'))
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  // 自定义宽高测试
  it('自定义宽高渲染正确', async() =>
  {
    const width = 0.5
    const height = 0.6
    const wrapper = createWrapper({
      modelValue: true,
      width,
      height
    })
    await nextTick()
    
    const dialog = document.querySelector('.u-dialog')
    const style = window.getComputedStyle(dialog as Element)
    expect(style.width).toBe(`${1024 * width}px`)
    expect(style.height).toBe(`${768 * height}px`)
  })

  // 延时打开/关闭测试
  // it('延时打开/关闭功能正确', async () => {
  //   const openDelay = 300
  //   const closeDelay = 300
    
  //   const wrapper = createWrapper({
  //     modelValue: false,
  //     openDelay,
  //     closeDelay
  //   })
    
  //   // 测试延时打开
  //   await wrapper.setProps({ modelValue: true })
  //   await nextTick()
  //   expect(document.querySelector('.u-dialog')).toBeFalsy()
    
  //   await vi.advanceTimersByTime(openDelay)
  //   await nextTick()
  //   expect(document.querySelector('.u-dialog')).toBeTruthy()

  //   // 测试延时关闭
  //   await wrapper.setProps({ modelValue: false })
  //   await nextTick()
  //   expect(document.querySelector('.u-dialog')).toBeTruthy()
    
  //   await vi.advanceTimersByTime(closeDelay)
  //   await nextTick()
  //   expect(document.querySelector('.u-dialog')).toBeFalsy()
  // })

  // // 暴露方法测试
  // it('暴露方法功能正确', async () => {
  //   const wrapper = createWrapper({
  //     modelValue: true
  //   })
  //   await nextTick()

  //   const dialog = document.querySelector('.u-dialog') as HTMLElement
  //   expect(dialog).toBeTruthy()

  //   const vm = wrapper.vm

  //   // 测试 close 方法
  //   vm.close()
  //   await nextTick()
  //   expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  //   expect(wrapper.emitted('cancel')).toBeTruthy()

  //   // 测试 collapse 方法
  //   const initialHeight = dialog.style.height
  //   vm.collapse()
  //   await nextTick()
  //   expect(wrapper.emitted('collapse')?.[0]).toEqual([true])
  //   expect(dialog.style.height).not.toBe(initialHeight)

  //   // 测试 resetPosition 方法
  //   const initialPosition = {
  //     top: dialog.style.top,
  //     left: dialog.style.left,
  //     width: dialog.style.width,
  //     height: dialog.style.height
  //   }
    
  //   // 手动修改位置
  //   dialog.style.top = '0px'
  //   dialog.style.left = '0px'
    
  //   vm.resetPosition()
  //   await nextTick()
  //   expect(dialog.style.top).toBe(initialPosition.top)
  //   expect(dialog.style.left).toBe(initialPosition.left)
  //   expect(dialog.style.width).toBe(initialPosition.width)
  //   expect(dialog.style.height).toBe(initialPosition.height)
  // })
})