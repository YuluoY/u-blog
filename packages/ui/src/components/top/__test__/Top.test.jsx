import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UTop } from '..';
import { nextTick } from 'vue';
import { pxToRem } from '@u-blog/utils';
vi.mock('@u-blog/composables', () => {
    const mockScrollTo = vi.fn(() => Promise.resolve());
    return {
        useScrollTo: vi.fn(() => ({ scrollTo: mockScrollTo })),
        useResize: vi.fn(() => ({})),
        useDraggle: vi.fn(() => ({})),
        useEventListener: vi.fn(),
        useOffset: vi.fn(() => ({ topOffset: { value: 0 }, bottomOffset: { value: 0 } })),
        useZIndex: vi.fn(() => ({ nextZIndex: vi.fn(() => 2000) })),
        useWatchRef: vi.fn((val) => ({ value: val })),
        useClickOutside: vi.fn(),
        useState: vi.fn((initial) => [{ value: initial }, vi.fn()]),
        useFixed: vi.fn(),
        useDebounceRef: vi.fn((val) => ({ value: val }))
    };
});
// 创建通用的测试配置
const createWrapper = (props = {}, slots = {}) => {
    // 创建目标容器
    const container = document.createElement('div');
    container.id = 'top-container';
    document.body.appendChild(container);
    return mount(UTop, {
        props: {
            appendTo: '#top-container',
            modelValue: true, // 默认显示组件
            ...props
        },
        slots,
        attachTo: document.body
    });
};
describe('UTop 组件测试', () => {
    beforeEach(() => {
        // 清理 body
        document.body.innerHTML = '';
        // 模拟 window 尺寸和滚动
        Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
        Object.defineProperty(window.document.documentElement, 'clientWidth', { value: 1024, configurable: true });
        Object.defineProperty(window.document.documentElement, 'clientHeight', { value: 768, configurable: true });
        Object.defineProperty(window.document.documentElement, 'scrollHeight', { value: 2000, configurable: true });
        Object.defineProperty(window.document.documentElement, 'scrollTop', {
            value: 0,
            configurable: true,
            writable: true
        });
    });
    afterEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });
    // 基础渲染测试
    it('默认渲染正确', async () => {
        const wrapper = createWrapper();
        await nextTick();
        const top = document.querySelector('.u-top');
        expect(top).toBeTruthy();
        expect(top?.querySelector('.u-top__inner')).toBeTruthy();
        expect(top?.querySelector('.u-top__default')?.textContent).toBe('TOP');
    });
    // 尺寸测试
    it('尺寸设置正确', async () => {
        const size = 60;
        const wrapper = createWrapper({
            size
        });
        await nextTick();
        const top = document.querySelector('.u-top');
        expect(top.style.width).toBe(pxToRem(size));
        expect(top.style.height).toBe(pxToRem(size));
    });
    // 位置测试
    it('位置设置正确', async () => {
        const offset = 100;
        const wrapper = createWrapper({
            position: 'left',
            offset
        });
        await nextTick();
        const top = document.querySelector('.u-top');
        expect(top.style.left).toBe(pxToRem(offset));
        expect(top.style.bottom).toBe(pxToRem(offset));
        await wrapper.setProps({ position: 'right' });
        await nextTick();
        expect(top.style.right).toBe(pxToRem(offset));
        expect(top.style.bottom).toBe(pxToRem(offset));
    });
    // 滚动阈值测试
    // it('滚动阈值功能正确', async () => {
    //   const wrapper = createWrapper({
    //     scrollThreshold: '30%'
    //   })
    //   await nextTick()
    //   // 设置容器尺寸
    //   const container = document.querySelector('#top-container') as HTMLElement
    //   Object.defineProperty(container, 'clientHeight', { value: 768, configurable: true })
    //   Object.defineProperty(container, 'scrollHeight', { value: 2000, configurable: true })
    //   Object.defineProperty(container, 'scrollTop', {
    //     value: 0,
    //     configurable: true,
    //     writable: true
    //   })
    //   // 模拟滚动小于阈值
    //   container.scrollTop = 100
    //   container.dispatchEvent(new Event('scroll'))
    //   await nextTick()
    //   expect((wrapper.vm as UTopInstance).visible).toBe(false)
    //   // 模拟滚动超过阈值
    //   container.scrollTop = 800
    //   container.dispatchEvent(new Event('scroll'))
    //   await nextTick()
    //   expect((wrapper.vm as UTopInstance).visible).toBe(true)
    // })
    // 点击事件测试
    it('点击事件触发正确', async () => {
        const wrapper = createWrapper();
        await nextTick();
        const top = document.querySelector('.u-top');
        await top?.dispatchEvent(new Event('click'));
        expect(wrapper.emitted('click')).toBeTruthy();
    });
    // 暴露方法测试
    // it('暴露方法功能正确', async () => {
    //   const wrapper = createWrapper()
    //   await nextTick()
    //   const vm = wrapper.vm as UTopInstance
    //   // 测试 show/hide 方法
    //   vm.show()
    //   await nextTick()
    //   expect(vm.visible).toBe(true)
    //   vm.hide()
    //   await nextTick()
    //   expect(vm.visible).toBe(false)
    //   // 测试 toggle 方法
    //   vm.toggle()
    //   await nextTick()
    //   expect(vm.visible).toBe(true)
    //   vm.toggle()
    //   await nextTick()
    //   expect(vm.visible).toBe(false)
    //   // 设置容器尺寸
    //   const container = document.querySelector('#top-container') as HTMLElement
    //   Object.defineProperty(container, 'clientHeight', { value: 768, configurable: true })
    //   Object.defineProperty(container, 'scrollHeight', { value: 2000, configurable: true })
    //   Object.defineProperty(container, 'scrollTop', {
    //     value: 0,
    //     configurable: true,
    //     writable: true
    //   })
    //   // 测试 scrollTo 方法
    //   const targetPosition = 500
    //   await vm.scrollTo(targetPosition)
    //   expect(container.scrollTop).toBe(targetPosition)
    //   // 测试 scrollToTop 方法
    //   await vm.scrollToTop()
    //   expect(container.scrollTop).toBe(0)
    //   // 测试 scrollToBottom 方法
    //   await vm.scrollToBottom()
    //   expect(container.scrollTop).toBe(container.scrollHeight - container.clientHeight)
    //   // 测试 scrollToElement 方法
    //   const targetElement = document.createElement('div')
    //   targetElement.style.position = 'absolute'
    //   targetElement.style.top = '300px'
    //   container.appendChild(targetElement)
    //   await vm.scrollToElement(targetElement)
    //   expect(container.scrollTop).toBe(300)
    // })
    // 动画过渡测试
    // it('动画过渡设置正确', async () => {
    //   const animationClass = 'custom-animation'
    //   const wrapper = createWrapper({
    //     animationClass
    //   })
    //   await nextTick()
    //   const transition = wrapper.find('transition')
    //   expect(transition.attributes('name')).toBe(animationClass)
    // })
    // 自定义内容测试
    it('自定义内容渲染正确', async () => {
        const customContent = '返回顶部';
        const wrapper = createWrapper({}, {
            default: () => customContent
        });
        await nextTick();
        const inner = document.querySelector('.u-top__inner');
        expect(inner?.textContent?.trim()).toBe(customContent);
    });
});
