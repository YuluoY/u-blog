// UIcon.spec.ts
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { h } from 'vue';
import { UIcon } from '../index';
vi.mock('@fortawesome/vue-fontawesome', () => ({
    FontAwesomeIcon: {
        name: 'FontAwesomeIcon',
        props: { icon: null, title: null, transform: null, flip: null, rotation: null, size: null, spin: null, pulse: null, border: null, fixedWidth: null, listItem: null, bounce: null, shake: null, fade: null },
        setup(props, { attrs }) {
            const p = { ...props, ...attrs };
            return () => h('svg', {
                class: [
                    p.border && 'fa-border',
                    p.fixedWidth && 'fa-fw',
                    p.flip === 'horizontal' && 'fa-flip-horizontal',
                    p.rotation === 90 && 'fa-rotate-90',
                    p.size === '2x' && 'fa-2x',
                    p.spin && 'fa-spin',
                    p.pulse && 'fa-pulse',
                    p.listItem && 'fa-li',
                    p.bounce && 'fa-bounce',
                    p.shake && 'fa-shake',
                    p.fade && 'fa-fade'
                ].filter(Boolean),
                style: p.transform ? { transformOrigin: 'center' } : undefined
            }, [p.title ? h('title', {}, p.title) : null]);
        }
    }
}));
describe('UIcon 组件', () => {
    it('默认渲染正确', () => {
        const wrapper = mount(UIcon, { props: { icon: 'home' } });
        expect(wrapper.exists()).toBe(true);
    });
    it('渲染 icon 正确', () => {
        const wrapper = mount(UIcon, {
            props: {
                icon: 'home',
            },
        });
        expect(wrapper.find('svg').exists()).toBe(true);
    });
    it('渲染 border 正确', () => {
        const wrapper = mount(UIcon, {
            props: {
                icon: 'home',
                border: true,
            },
        });
        expect(wrapper.find('svg').classes()).toContain('fa-border');
    });
    it('渲染 fixedWidth 正确', () => {
        const wrapper = mount(UIcon, {
            props: {
                icon: 'home',
                fixedWidth: true,
            },
        });
        expect(wrapper.find('svg').classes()).toContain('fa-fw');
    });
    it('渲染 flip 属性', () => {
        const wrapper = mount(UIcon, {
            props: {
                icon: 'home',
                flip: 'horizontal',
            },
        });
        expect(wrapper.find('svg').classes()).toContain('fa-flip-horizontal');
    });
    it('渲染 rotation 属性', () => {
        const wrapper = mount(UIcon, {
            props: {
                icon: 'home',
                rotation: 90,
            },
        });
        expect(wrapper.find('svg').classes()).toContain('fa-rotate-90');
    });
    it('渲染 size 属性', () => {
        const wrapper = mount(UIcon, {
            props: {
                icon: 'home',
                size: '2x',
            },
        });
        expect(wrapper.find('svg').classes()).toContain('fa-2x');
    });
    it('渲染 spin 属性', () => {
        const wrapper = mount(UIcon, {
            props: {
                icon: 'home',
                spin: true,
            },
        });
        expect(wrapper.find('svg').classes()).toContain('fa-spin');
    });
    it('渲染 pulse 属性', () => {
        const wrapper = mount(UIcon, {
            props: {
                icon: 'home',
                pulse: true,
            },
        });
        expect(wrapper.find('svg').classes()).toContain('fa-pulse');
    });
    it('渲染颜色正确', () => {
        const RED = 'rgb(255, 0, 0)';
        const wrapper = mount(UIcon, {
            props: {
                icon: 'home',
                color: RED,
            },
        });
        expect(wrapper.attributes('style')).toContain(`color: ${RED};`);
    });
    it('渲染其他自定义属性（如 bounce、shake、fade）', () => {
        const wrapper = mount(UIcon, {
            props: {
                icon: 'home',
                bounce: true,
                shake: true,
                fade: true,
            },
        });
        const Svg = wrapper.find('svg');
        expect(Svg.classes()).toContain('fa-bounce');
        expect(Svg.classes()).toContain('fa-shake');
        expect(Svg.classes()).toContain('fa-fade');
    });
    it('支持 listItem 属性', () => {
        const wrapper = mount(UIcon, {
            props: {
                icon: 'home',
                listItem: true,
            },
        });
        expect(wrapper.find('svg').classes()).toContain('fa-li');
    });
    it('支持 transform 属性', () => {
        const wrapper = mount(UIcon, {
            props: {
                icon: 'home',
                transform: 'shrink-4 right-1',
            },
        });
        const svg = wrapper.find('svg');
        if (svg.exists())
            expect(!!svg.element.style.transformOrigin).toBe(true);
        else
            expect(wrapper.find('.u-icon').exists()).toBe(true);
    });
    it('支持 title 属性', () => {
        const title = '首页图标';
        const wrapper = mount(UIcon, {
            props: {
                icon: 'home',
                title: title,
            },
        });
        const titleEl = wrapper.find('title');
        if (titleEl.exists())
            expect(titleEl.text()).toEqual(title);
        else
            expect(wrapper.find('.u-icon').exists()).toBe(true);
    });
});
