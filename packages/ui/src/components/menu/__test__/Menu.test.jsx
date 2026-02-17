import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { h, ref } from 'vue';
import { UMenu, UMenuItem, USubMenu } from '..';
import { CMenuCtx } from '../consts';
function createMenuCtx(active = '') {
    const activeIndex = ref(active);
    return {
        activeIndex,
        setActiveIndex: (v) => { activeIndex.value = v; },
        getLevel: () => 0,
        addSubMenuLevel: () => { },
        mode: 'vertical',
        level: ref(0)
    };
}
describe('UMenu 全场景单例测试', () => {
    it('默认渲染', () => {
        const wrapper = mount(UMenu, {
            slots: { default: () => h(UMenuItem, { index: '1' }, () => '项1') }
        });
        expect(wrapper.find('.u-menu').exists()).toBe(true);
        expect(wrapper.find('.u-menu').attributes('role')).toBe('menu');
    });
    it('mode 水平/垂直', () => {
        const w1 = mount(UMenu, { props: { mode: 'vertical' } });
        expect(w1.find('.u-menu--vertical').exists()).toBe(true);
        const w2 = mount(UMenu, { props: { mode: 'horizontal' } });
        expect(w2.find('.u-menu--horizontal').exists()).toBe(true);
    });
    it('MenuItem 渲染与 active', () => {
        const wrapper = mount(UMenu, {
            props: { defaultActive: '2' },
            slots: {
                default: () => [
                    h(UMenuItem, { index: '1' }, () => '项1'),
                    h(UMenuItem, { index: '2' }, () => '项2')
                ]
            }
        });
        const items = wrapper.findAll('.u-menu-item');
        expect(items.length).toBeGreaterThanOrEqual(1);
        const activeItem = wrapper.find('.u-menu-item.is-active');
        expect(activeItem.exists()).toBe(true);
    });
    it('MenuItem 点击切换 active', async () => {
        const wrapper = mount(UMenu, {
            slots: {
                default: () => [
                    h(UMenuItem, { index: 'a' }, () => 'A'),
                    h(UMenuItem, { index: 'b' }, () => 'B')
                ]
            }
        });
        await wrapper.findAll('.u-menu-item')[1].trigger('click');
        expect(wrapper.find('.u-menu-item.is-active').exists()).toBe(true);
    });
    it('MenuItem disabled 样式与 aria', () => {
        const ctx = createMenuCtx();
        const wrapper = mount(UMenuItem, {
            props: { index: '1', disabled: true },
            slots: { default: () => '项' },
            global: {
                provide: { [CMenuCtx]: ctx }
            }
        });
        expect(wrapper.find('.is-disabled').exists()).toBe(true);
        expect(wrapper.find('li').attributes('aria-disabled')).toBe('true');
    });
    it('SubMenu 渲染与展开', async () => {
        const ctx = createMenuCtx();
        const wrapper = mount(USubMenu, {
            props: { index: 'sub1', title: '子菜单' },
            slots: {
                default: () => h(UMenuItem, { index: '1' }, () => '子项'),
                title: () => '子菜单'
            },
            global: { provide: { [CMenuCtx]: ctx } }
        });
        expect(wrapper.find('.u-sub-menu__title').exists()).toBe(true);
        expect(wrapper.find('.u-sub-menu__list').exists()).toBe(true);
        await wrapper.find('.u-sub-menu__title').trigger('click');
        expect(wrapper.vm.isOpened).toBe(true);
    });
});
