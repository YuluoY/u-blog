import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { USlider } from '..';
const createWrapper = (props = {}) => mount(USlider, { props });
describe('USlider 全场景单例测试', () => {
    it('默认渲染', () => {
        const wrapper = createWrapper();
        expect(wrapper.find('.u-slider').exists()).toBe(true);
        expect(wrapper.find('.u-slider__track').exists()).toBe(true);
        expect(wrapper.find('.u-slider__progress').exists()).toBe(true);
        expect(wrapper.find('.u-slider__thumb-wrapper').exists()).toBe(true);
    });
    it('role 与 aria 属性', () => {
        const wrapper = createWrapper({ modelValue: 50, min: 0, max: 100 });
        const el = wrapper.find('.u-slider');
        expect(el.attributes('role')).toBe('slider');
        expect(el.attributes('aria-valuenow')).toBe('50');
        expect(el.attributes('aria-valuemin')).toBe('0');
        expect(el.attributes('aria-valuemax')).toBe('100');
    });
    it('disabled 类名与 tabindex', () => {
        const wrapper = createWrapper({ disabled: true });
        expect(wrapper.find('.u-slider').classes()).toContain('is-disabled');
        expect(wrapper.find('.u-slider').attributes('tabindex')).toBe('-1');
    });
    it('vertical 类名', () => {
        const wrapper = createWrapper({ vertical: true });
        expect(wrapper.find('.u-slider').classes()).toContain('is-vertical');
    });
    it('showInput 渲染输入框', () => {
        const wrapper = createWrapper({ showInput: true });
        expect(wrapper.find('.u-slider__input-wrapper').exists()).toBe(true);
        expect(wrapper.find('.u-slider__input').exists()).toBe(true);
    });
    it('showStops 与 step 渲染刻度', () => {
        const wrapper = createWrapper({ showStops: true, step: 25, min: 0, max: 100 });
        expect(wrapper.find('.u-slider__stops').exists()).toBe(true);
        expect(wrapper.findAll('.u-slider__stop').length).toBeGreaterThan(0);
    });
    it('进度条宽度随 modelValue 变化', async () => {
        const wrapper = createWrapper({ modelValue: 30, min: 0, max: 100, showTooltip: false });
        expect(wrapper.find('.u-slider__progress').element.style.width).toBe('30%');
        await wrapper.setProps({ modelValue: 80 });
        expect(wrapper.find('.u-slider__progress').element.style.width).toBe('80%');
    });
});
