import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { UTable } from '..'
import type { UTableColumn, UTableProps } from '../types'

const columns: UTableColumn[] = [
  { prop: 'name', label: '姓名' },
  { prop: 'age', label: '年龄' }
]
const data = [
  { name: '张三', age: 20 },
  { name: '李四', age: 25 }
]

describe('UTable 全场景单例测试', () => {
  it('默认空渲染', () => {
    const wrapper = mount(UTable)
    expect(wrapper.find('.u-table').exists()).toBe(true)
    expect(wrapper.find('thead').exists()).toBe(true)
    expect(wrapper.findAll('tbody tr')).toHaveLength(0)
  })

  it('data + columns 渲染', () => {
    const wrapper = mount(UTable, { props: { data, columns } })
    expect(wrapper.findAll('thead th')).toHaveLength(2)
    expect(wrapper.find('thead th').text()).toBe('姓名')
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(wrapper.find('tbody tr:first-child td').text()).toBe('张三')
    expect(wrapper.findAll('tbody tr')[0].findAll('td')[1].text()).toBe('20')
  })

  it('stripe 与 border 类名', () => {
    const w1 = mount(UTable, { props: { data, columns, stripe: true } })
    expect(w1.find('.u-table--stripe').exists()).toBe(true)
    const w2 = mount(UTable, { props: { data, columns, border: true } })
    expect(w2.find('.u-table--border').exists()).toBe(true)
  })

  it('formatter 自定义渲染', () => {
    const cols: UTableColumn[] = [
      { prop: 'name', label: '姓名' },
      { prop: 'age', label: '年龄', formatter: (_row, _col, val) => `${val}岁` }
    ]
    const wrapper = mount(UTable, { props: { data, columns: cols } })
    expect(wrapper.findAll('tbody tr')[0].findAll('td')[1].text()).toBe('20岁')
  })

  it('空数据显示 —', () => {
    const wrapper = mount(UTable, {
      props: {
        data: [{ name: 'x', age: undefined }],
        columns
      }
    })
    expect(wrapper.find('tbody td:last-child').text()).toBe('—')
  })
})
