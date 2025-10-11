import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { CTimelineContextKey } from '../consts/index'

import UTimeline from '../src/Timeline.vue'
import UTimelineItem from '../src/TimelineItem.vue'
import type { UTimelineProps } from '../types'
import { pxToRem } from '@u-blog/utils'

// 创建通用的测试配置
const createWrapper = (props: Partial<UTimelineProps> & any = { data: [] }, options = {}) =>
{
  return mount(UTimeline, {
    props,
    global: {
      provide: {
        [CTimelineContextKey as symbol]: {
          onCalcLine: vi.fn()
        }
      }
    },
    ...options
  })
}

const createItemWrapper = (props = {}, options = {}) =>
{
  return mount(UTimelineItem, {
    props,
    global: {
      provide: {
        [CTimelineContextKey as symbol]: {
          onCalcLine: vi.fn()
        }
      }
    },
    ...options
  })
}

describe('UTimeline 组件测试', () =>
{
  it('默认渲染正确', () =>
  {
    const wrapper = createWrapper()
    expect(wrapper.classes()).toContain('u-timeline')
    expect(wrapper.exists()).toBe(true)
  })

  it('根据方向渲染正确', () =>
  {
    const wrapper = createWrapper({ direction: 'horizontal' })
    expect(wrapper.classes()).toContain('u-timeline--horizontal')
  })

  it('垂直方向渲染正确', () =>
  {
    const wrapper = createWrapper({ direction: 'vertical' })
    expect(wrapper.classes()).toContain('u-timeline--vertical')
  })

  it('数据渲染正确', () =>
  {
    const data = [
      {
        content: '测试内容1',
        date: '2024-01-01',
        type: 'primary',
        placement: 'top'
      },
      {
        content: '测试内容2',
        date: '2024-01-02',
        type: 'success',
        placement: 'top'
      }
    ]
    const wrapper = createWrapper({ data })
    const items = wrapper.findAllComponents(UTimelineItem)
    expect(items).toHaveLength(2)
  })

  it('自定义间隔和边距正确', () =>
  {
    const wrapper = createWrapper({
      gutter: 50,
      margin: 30
    })
    const styles = wrapper.element.style
    expect(styles.getPropertyValue('--timeline-gutter')).toBe(pxToRem(50))
    expect(styles.getPropertyValue('--timeline-margin')).toBe(pxToRem(30))
  })

  it('自定义线条颜色正确', () =>
  {
    const wrapper = createWrapper({
      lineColor: '#ff0000'
    })
    const styles = wrapper.element.style
    expect(styles.getPropertyValue('--timeline-line-color')).toBe('#ff0000')
  })

  it('空数据渲染正确', () =>
  {
    const wrapper = createWrapper({ data: [] })
    const items = wrapper.findAllComponents(UTimelineItem)
    expect(items).toHaveLength(0)
  })
})

describe('UTimelineItem 组件测试', () =>
{
  it('默认渲染正确', () =>
  {
    const wrapper = createItemWrapper()
    expect(wrapper.classes()).toContain('u-timeline-item')
    expect(wrapper.exists()).toBe(true)
  })

  it('内容渲染正确', () =>
  {
    const wrapper = createItemWrapper({
      content: '测试内容'
    })
    expect(wrapper.text()).toContain('测试内容')
  })

  it('日期渲染正确', () =>
  {
    const wrapper = createItemWrapper({
      content: '测试内容',
      date: '2024-01-01'
    })
    expect(wrapper.text()).toContain('2024-01-01')
  })

  it('日期位置 top 渲染正确', () =>
  {
    const wrapper = createItemWrapper({
      content: '测试内容',
      date: '2024-01-01',
      placement: 'top'
    })
    const dateElement = wrapper.find('.u-timeline-item-date')
    expect(dateElement.exists()).toBe(true)
  })

  it('日期位置 bottom 渲染正确', () =>
  {
    const wrapper = createItemWrapper({
      content: '测试内容',
      date: '2024-01-01',
      placement: 'bottom'
    })
    const dateElements = wrapper.findAll('.u-timeline-item-date')
    expect(dateElements).toHaveLength(1)
  })

  it('不同类型渲染正确', () =>
  {
    const types = ['primary', 'success', 'warning', 'danger', 'info', 'link']
    types.forEach(type =>
    {
      const wrapper = createItemWrapper({
        content: '测试内容',
        type
      })
      expect(wrapper.find('.u-timeline-item-dot').classes()).toContain(`u-timeline-item-dot--${type}`)
    })
  })

  it('不同大小渲染正确', () =>
  {
    const sizes = ['normal', 'large']
    sizes.forEach(size =>
    {
      const wrapper = createItemWrapper({
        content: '测试内容',
        size
      })
      expect(wrapper.find('.u-timeline-item-dot').classes()).toContain(`u-timeline-item-dot--${size}`)
    })
  })

  it('不同位置渲染正确', () =>
  {
    const positions = ['left', 'right', 'center']
    positions.forEach(position =>
    {
      const wrapper = createItemWrapper({
        content: '测试内容',
        position
      })
      expect(wrapper.find('.u-timeline-item-dot').classes()).toContain(`u-timeline-item-dot--${position}`)
    })
  })

  it('空心圆点渲染正确', () =>
  {
    const wrapper = createItemWrapper({
      content: '测试内容',
      hollow: true
    })
    expect(wrapper.find('.u-timeline-item-dot').classes()).toContain('u-timeline-item-dot--hollow')
  })

  it('自定义图标渲染正确', () =>
  {
    const wrapper = createItemWrapper({
      content: '测试内容',
      icon: 'check'
    })
    const iconElement = wrapper.findComponent({ name: 'UIcon' })
    expect(iconElement.exists()).toBe(true)
    expect(iconElement.props('icon')).toBe('check')
  })

  it('自定义颜色渲染正确', () =>
  {
    const wrapper = createItemWrapper({
      content: '测试内容',
      color: '#ff0000'
    })
    const dotElement = wrapper.find('.u-timeline-item-dot')
    expect(dotElement.element.style.color).toBe('rgb(255, 0, 0)')
  })

  it('点击事件触发正确', async() =>
  {
    const handleDotClick = vi.fn()
    const wrapper = createItemWrapper({
      content: '测试内容',
      dotClick: handleDotClick
    })
    
    const dotElement = wrapper.find('.u-timeline-item-dot')
    await dotElement.trigger('click')
    
    expect(handleDotClick).toHaveBeenCalled()
  })

  it('emit 事件触发正确', async () =>
  {
    const wrapper = createItemWrapper({
      content: '测试内容'
    })
    
    const dotElement = wrapper.find('.u-timeline-item-dot')
    await dotElement.trigger('click')
    
    expect(wrapper.emitted('dot-click')).toBeTruthy()
    expect(wrapper.emitted('dot-click')?.[0]).toHaveLength(2)
  })

  it('插槽内容渲染正确', () =>
  {
    const wrapper = createItemWrapper({
      content: '测试内容',
      date: '2024-01-01'
    }, {
      slots: {
        content: '自定义内容',
        date: '自定义日期'
      }
    })
    
    expect(wrapper.text()).toContain('自定义内容')
    expect(wrapper.text()).toContain('自定义日期')
  })
})

describe('UTimeline 组件集成测试', () =>
{
  it('完整时间线渲染正确', () =>
  {
    const data = [
      {
        content: '项目启动',
        date: '2024-01-01',
        type: 'primary',
        placement: 'top'
      },
      {
        content: '开发阶段',
        date: '2024-01-15',
        type: 'warning',
        icon: 'code',
        placement: 'top'
      },
      {
        content: '测试阶段',
        date: '2024-01-30',
        type: 'info',
        placement: 'bottom'
      },
      {
        content: '项目完成',
        date: '2024-02-15',
        type: 'success',
        icon: 'check',
        placement: 'top'
      }
    ]
    
    const wrapper = createWrapper({
      data,
      direction: 'vertical',
      gutter: 40,
      margin: 25,
      lineColor: '#409eff'
    })
    
    expect(wrapper.classes()).toContain('u-timeline--vertical')
    expect(wrapper.findAllComponents(UTimelineItem)).toHaveLength(4)
    
    const styles = wrapper.element.style
    expect(styles.getPropertyValue('--timeline-gutter')).toBe(pxToRem(40))
    expect(styles.getPropertyValue('--timeline-margin')).toBe(pxToRem(25))
    expect(styles.getPropertyValue('--timeline-line-color')).toBe('#409eff')
  })

  it('水平时间线渲染正确', () =>
  {
    const data = [
      {
        content: '开始',
        date: '2024-01-01',
        type: 'primary',
        placement: 'top'
      },
      {
        content: '进行中',
        date: '2024-01-15',
        type: 'warning',
        placement: 'top'
      },
      {
        content: '完成',
        date: '2024-01-30',
        type: 'success',
        placement: 'top'
      }
    ]
    
    const wrapper = createWrapper({
      data,
      direction: 'horizontal',
      gutter: 60,
      margin: 20
    })
    
    expect(wrapper.classes()).toContain('u-timeline--horizontal')
    expect(wrapper.findAllComponents(UTimelineItem)).toHaveLength(3)
  })
})
