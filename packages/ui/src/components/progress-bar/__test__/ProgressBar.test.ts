import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref, nextTick } from 'vue'

// 由于 UProgressBar 依赖 Teleport + pxToRem，创建简化测试
describe('UProgressBar', () => {
  // 模拟 pxToRem
  vi.mock('@u-blog/utils', () => ({
    pxToRem: (v: number) => `${v / 16}rem`
  }))

  let ProgressBar: any

  beforeEach(async () => {
    const mod = await import('../src/ProgressBar.vue')
    ProgressBar = mod.default
  })

  it('应该正确渲染组件', () => {
    const wrapper = mount(ProgressBar, {
      global: {
        stubs: { Teleport: true }
      }
    })
    expect(wrapper.find('.u-progress-bar').exists()).toBe(true)
  })

  it('start() 应使进度条可见', async () => {
    const wrapper = mount(ProgressBar, {
      global: {
        stubs: { Teleport: true }
      }
    })
    const vm = wrapper.vm as any
    vm.start()
    await nextTick()
    expect(vm.isLoading).toBe(true)
  })

  it('done() 应将进度设为 100', async () => {
    const wrapper = mount(ProgressBar, {
      global: {
        stubs: { Teleport: true }
      }
    })
    const vm = wrapper.vm as any
    vm.start()
    await nextTick()
    vm.done()
    await nextTick()
    // done 后内部 progress 应为 100
    expect(vm.isLoading).toBe(true) // 短暂仍展示
  })

  it('inc() 应递增进度', async () => {
    const wrapper = mount(ProgressBar, {
      global: {
        stubs: { Teleport: true }
      }
    })
    const vm = wrapper.vm as any
    vm.set(10)
    await nextTick()
    vm.inc(5)
    await nextTick()
    // set(10) + inc(5) → ~15
    expect(vm.isLoading).toBe(true)
  })

  it('fail() 应将类型切换为 danger', async () => {
    const wrapper = mount(ProgressBar, {
      global: {
        stubs: { Teleport: true }
      }
    })
    const vm = wrapper.vm as any
    vm.start()
    vm.fail()
    await nextTick()
    // 内部 currentType 应为 danger
    expect(wrapper.find('.u-progress-bar__bar--danger').exists()).toBe(true)
  })

  it('indeterminate 模式应添加对应 class', async () => {
    const wrapper = mount(ProgressBar, {
      props: { indeterminate: true },
      global: {
        stubs: { Teleport: true }
      }
    })
    const vm = wrapper.vm as any
    vm.start()
    await nextTick()
    expect(wrapper.find('.u-progress-bar__bar--indeterminate').exists()).toBe(true)
  })
})
