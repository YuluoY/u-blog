import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import { UBadge } from '..';
// 创建通用的测试配置
const createWrapper = (props = {}, slots = {}) => {
    return mount(UBadge, {
        props,
        slots
    });
};
describe('UBadge 组件测试', () => {
    // 基础渲染测试
    it('默认渲染正确', () => {
        const wrapper = createWrapper();
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.classes()).toContain('u-badge');
    });
    // 值显示测试
    it('值显示正确', () => {
        const value = '5';
        const wrapper = createWrapper({
            value
        });
        const content = wrapper.find('.u-badge-content');
        expect(content.exists()).toBe(true);
        expect(content.text()).toBe(value);
    });
    // 最大值测试
    it('最大值处理正确', () => {
        const wrapper = createWrapper({
            value: 100,
            max: 99
        });
        const content = wrapper.find('.u-badge-content');
        expect(content.text()).toBe('99+');
    });
    // 小圆点模式测试
    it('小圆点模式渲染正确', () => {
        const wrapper = createWrapper({
            isDot: true
        });
        expect(wrapper.find('.u-badge-dot').exists()).toBe(true);
        expect(wrapper.find('.u-badge-content').exists()).toBe(false);
    });
    // 隐藏测试
    it('隐藏功能正确', () => {
        const wrapper = createWrapper({
            hidden: true
        });
        expect(wrapper.find('.u-badge-content').exists()).toBe(false);
        expect(wrapper.find('.u-badge-dot').exists()).toBe(false);
    });
    // 类型测试
    it('不同类型渲染正确', () => {
        const types = ['primary', 'success', 'warning', 'danger', 'info'];
        types.forEach(type => {
            const wrapper = createWrapper({
                type
            });
            expect(wrapper.find(`.u-badge-${type}`).exists()).toBe(true);
        });
    });
    // 值为0时的显示测试
    it('值为0时的显示控制正确', async () => {
        const wrapper = createWrapper({
            value: 0,
            showZero: true
        });
        expect(wrapper.find('.u-badge-content').exists()).toBe(true);
        await wrapper.setProps({ showZero: false });
        expect(wrapper.find('.u-badge-content').exists()).toBe(false);
    });
    // 自定义颜色测试
    it('自定义颜色渲染正确', () => {
        const color = 'rgb(255, 0, 0)';
        const wrapper = createWrapper({
            color
        });
        const content = wrapper.find('.u-badge-content');
        expect(content.attributes('style')).toContain(`background-color: ${color}`);
    });
    // 偏移量测试
    it('偏移量设置正确', () => {
        const offset = [10, 20];
        const wrapper = createWrapper({
            offset
        });
        const content = wrapper.find('.u-badge-content');
        const style = content.attributes('style');
        // 组件使用 pxToRem，输出为 rem
        expect(style).toMatch(/right:\s*[\d.]+rem/);
        expect(style).toMatch(/top:\s*[\d.]+rem/);
    });
    // 自定义样式测试
    it('自定义样式生效正确', () => {
        const badgeStyle = {
            fontSize: '20px'
        };
        const wrapper = createWrapper({
            badgeStyle
        });
        const content = wrapper.find('.u-badge-content');
        expect(content.attributes('style')).toContain('font-size: 20px');
    });
    // 自定义类名测试
    it('自定义类名添加正确', () => {
        const badgeClass = 'custom-badge';
        const wrapper = createWrapper({
            badgeClass
        });
        const content = wrapper.find('.u-badge-content');
        expect(content.classes()).toContain(badgeClass);
    });
    // 插槽测试
    it('默认插槽渲染正确', () => {
        const wrapper = createWrapper({}, {
            default: () => <div class="test-content">测试内容</div>
        });
        expect(wrapper.find('.test-content').exists()).toBe(true);
        expect(wrapper.find('.test-content').text()).toBe('测试内容');
    });
});
