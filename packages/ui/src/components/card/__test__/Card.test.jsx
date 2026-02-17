// UCard.spec.ts
import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import { UCard } from '../index';
import { pxToRem } from '@u-blog/utils';
describe('UCard 组件', () => {
    it('渲染 header 正确', () => {
        const wrapper = mount(UCard, {
            props: {
                header: '测试标题'
            },
        });
        expect(wrapper.find('.u-card-header').text()).toBe('测试标题');
    });
    it('渲染 footer 正确', () => {
        const wrapper = mount(UCard, {
            props: {
                footer: '测试页脚'
            },
        });
        expect(wrapper.find('.u-card-footer').text()).toBe('测试页脚');
    });
    it('渲染 shadow 正确', () => {
        const wrapper = mount(UCard, {
            props: {
                shadow: 'always'
            },
        });
        expect(wrapper.classes()).toContain('u-card--shadow-always');
    });
    it('渲染 padding 正确', () => {
        const wrapper = mount(UCard, {
            props: {
                padding: 20
            },
            slots: {
                default: '<div>测试内容</div>'
            }
        });
        const body = wrapper.find('.u-card-body');
        expect(body.attributes('style')).toContain(`padding: ${pxToRem(20)};`);
    });
    it('渲染 bodyStyle 正确', () => {
        const RED = 'rgb(255, 0, 0)';
        const wrapper = mount(UCard, {
            props: {
                bodyStyle: {
                    color: RED,
                    backgroundColor: RED,
                }
            },
            slots: {
                default: '<div>测试内容</div>'
            }
        });
        const body = wrapper.find('.u-card-body');
        expect(body.attributes('style')).toContain(`color: ${RED}`);
        expect(body.attributes('style')).toContain(`background-color: ${RED};`);
    });
    it('渲染 bodyClass 正确', () => {
        const wrapper = mount(UCard, {
            props: {
                bodyClass: 'custom-body-class'
            },
            slots: {
                default: '<div>测试内容</div>'
            }
        });
        const body = wrapper.find('.u-card-body');
        expect(body.classes()).toContain('custom-body-class');
    });
});
