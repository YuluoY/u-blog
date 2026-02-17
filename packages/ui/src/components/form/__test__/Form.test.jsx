import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import { UForm, UFormItem } from '..';
import { UInput } from '@/components';
import { nextTick } from 'vue';
describe('UForm 组件测试', () => {
    // 基础渲染测试
    it('默认渲染正确', () => {
        const wrapper = mount(UForm);
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.classes()).toContain('u-form');
    });
    // 标签位置测试
    it('标签位置渲染正确', () => {
        const wrapper = mount(UForm, {
            props: {
                labelPosition: 'left'
            }
        });
        expect(wrapper.classes()).toContain('u-form--label-left');
    });
    // 行内表单测试
    it('行内表单渲染正确', () => {
        const wrapper = mount(UForm, {
            props: {
                inline: true
            }
        });
        expect(wrapper.classes()).toContain('u-form--inline');
    });
    // 表单验证测试
    it('表单验证功能正确', async () => {
        const rules = {
            name: [
                { required: true, message: '请输入姓名', trigger: 'blur' }
            ],
            email: [
                { required: true, message: '请输入邮箱', trigger: 'blur' },
                { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
            ]
        };
        const wrapper = mount({
            template: `
        <UForm ref="form" :model="model" :rules="rules">
          <UFormItem prop="name" label="姓名">
            <UInput v-model="model.name" />
          </UFormItem>
          <UFormItem prop="email" label="邮箱">
            <UInput v-model="model.email" />
          </UFormItem>
        </UForm>
      `,
            components: {
                UForm,
                UFormItem,
                UInput
            },
            data() {
                return {
                    model: {
                        name: '',
                        email: ''
                    },
                    rules
                };
            }
        });
        const form = wrapper.vm.$refs.form;
        await form.validate();
        await nextTick();
        // 检查错误状态
        const formItems = wrapper.findAll('.u-form-item');
        expect(formItems[0].classes()).toContain('u-form-item--error');
        expect(formItems[1].classes()).toContain('u-form-item--error');
        // 输入有效值后再次验证
        const vm = wrapper.vm;
        vm.model.name = '张三';
        vm.model.email = 'test@example.com';
        await form.validate();
        await nextTick();
        // 检查成功状态
        expect(formItems[0].classes()).toContain('u-form-item--success');
        expect(formItems[1].classes()).toContain('u-form-item--success');
    });
    // 表单重置测试
    it('表单重置功能正确', async () => {
        const wrapper = mount({
            template: `
        <UForm ref="form" :model="model">
          <UFormItem prop="name">
            <UInput v-model="model.name" />
          </UFormItem>
        </UForm>
      `,
            components: {
                UForm,
                UFormItem,
                UInput
            },
            data() {
                return {
                    model: {
                        name: ''
                    }
                };
            }
        });
        // 设置初始值
        const vm = wrapper.vm;
        vm.model.name = '测试值';
        await nextTick();
        // 重置表单
        const form = wrapper.vm.$refs.form;
        form.resetFields();
        await nextTick();
        // 检查值是否被重置
        expect(vm.model.name).toBe('');
    });
    // 表单项验证测试
    it('单个表单项验证功能正确', async () => {
        const rules = {
            name: [
                { required: true, message: '请输入姓名', trigger: 'blur' }
            ]
        };
        const wrapper = mount({
            template: `
        <UForm ref="form" :model="model" :rules="rules">
          <UFormItem prop="name" ref="formItem">
            <UInput v-model="model.name" />
          </UFormItem>
        </UForm>
      `,
            components: {
                UForm,
                UFormItem,
                UInput
            },
            data() {
                return {
                    model: {
                        name: ''
                    },
                    rules
                };
            }
        });
        const form = wrapper.vm.$refs.form;
        await form.validateField('name');
        await nextTick();
        // 检查错误状态
        const formItem = wrapper.find('.u-form-item');
        expect(formItem.classes()).toContain('u-form-item--error');
        // 输入有效值后再次验证
        const vm = wrapper.vm;
        vm.model.name = '张三';
        await form.validateField('name');
        await nextTick();
        // 检查成功状态
        expect(formItem.classes()).toContain('u-form-item--success');
    });
    // 清除验证测试
    it('清除验证功能正确', async () => {
        const rules = {
            name: [
                { required: true, message: '请输入姓名', trigger: 'blur' }
            ]
        };
        const wrapper = mount({
            template: `
        <UForm ref="form" :model="model" :rules="rules">
          <UFormItem prop="name">
            <UInput v-model="model.name" />
          </UFormItem>
        </UForm>
      `,
            components: {
                UForm,
                UFormItem,
                UInput
            },
            data() {
                return {
                    model: {
                        name: ''
                    },
                    rules
                };
            }
        });
        const form = wrapper.vm.$refs.form;
        // 先触发验证
        await form.validate();
        await nextTick();
        // 检查错误状态
        const formItem = wrapper.find('.u-form-item');
        expect(formItem.classes()).toContain('u-form-item--error');
        // 清除验证
        form.clearValidate();
        await nextTick();
        // 检查验证状态是否被清除
        expect(formItem.classes()).not.toContain('u-form-item--error');
        expect(formItem.classes()).not.toContain('u-form-item--success');
    });
    // 尺寸测试
    it('表单尺寸渲染正确', () => {
        const wrapper = mount(UForm, {
            props: {
                size: 'large'
            },
            slots: {
                default: `
          <UFormItem>
            <UInput />
          </UFormItem>
        `
            },
            global: {
                components: {
                    UFormItem,
                    UInput
                }
            }
        });
        const formItem = wrapper.find('.u-form-item');
        expect(formItem.classes()).toContain('u-form-item--large');
    });
    // 必填星号测试
    it('必填星号显示正确', () => {
        const wrapper = mount({
            template: `
        <UForm :model="model" :rules="rules">
          <UFormItem label="测试" prop="test">
            <UInput v-model="model.test" />
          </UFormItem>
        </UForm>
      `,
            components: {
                UForm,
                UFormItem,
                UInput
            },
            data() {
                return {
                    model: { test: '' },
                    rules: {
                        test: [{ required: true, message: '必填项', trigger: 'blur' }]
                    }
                };
            }
        });
        expect(wrapper.find('.u-form-item__required-star').exists()).toBe(true);
    });
    // 标签后缀测试
    it('标签后缀渲染正确', () => {
        const wrapper = mount({
            template: `
        <UForm :model="model" label-suffix=":">
          <UFormItem label="测试">
            <UInput v-model="model.test" />
          </UFormItem>
        </UForm>
      `,
            components: {
                UForm,
                UFormItem,
                UInput
            },
            data() {
                return {
                    model: {
                        test: ''
                    }
                };
            }
        });
        const label = wrapper.find('.u-form-item__label');
        expect(label.text()).toBe('测试:');
    });
});
