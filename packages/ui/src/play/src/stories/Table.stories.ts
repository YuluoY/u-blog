import type { Meta } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import { UTable } from 'ucc-ui'
import 'ucc-ui/dist/index.css'
import type { UTableProps } from '../../../components/table/types'
import type { Story } from './types'
import { container } from './utils'

const meta: Meta<typeof UTable> = {
  title: 'Components/Table',
  component: UTable,
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'object',
      description: '显示的数据'
    },
    columns: {
      control: 'object',
      description: '表格列的配置描述'
    },
    height: {
      control: 'text',
      description: 'Table 的高度'
    },
    maxHeight: {
      control: 'text',
      description: 'Table 的最大高度'
    },
    stripe: {
      control: 'boolean',
      description: '是否为斑马纹 table'
    },
    border: {
      control: 'boolean',
      description: '是否带有纵向边框'
    },
    size: {
      control: 'select',
      options: ['large', 'default', 'small'],
      description: 'Table 的尺寸'
    },
    fit: {
      control: 'boolean',
      description: '列的宽度是否自撑开'
    },
    showHeader: {
      control: 'boolean',
      description: '是否显示表头'
    },
    highlightCurrentRow: {
      control: 'boolean',
      description: '是否要高亮当前行'
    },
    content: {
      control: 'text',
      description: '表格内容'
    }
  }
}

export const Default: Story<typeof UTable> = {
  args: {
    data: [
      {
        date: '2024-03-01',
        name: '张三',
        address: '北京市朝阳区'
      },
      {
        date: '2024-03-02',
        name: '李四',
        address: '上海市浦东新区'
      },
      {
        date: '2024-03-03',
        name: '王五',
        address: '广州市天河区'
      }
    ],
    columns: [
      {
        prop: 'date',
        label: '日期',
        width: '180'
      },
      {
        prop: 'name',
        label: '姓名',
        width: '180'
      },
      {
        prop: 'address',
        label: '地址'
      }
    ],
    stripe: true,
    border: true,
    size: 'default',
    fit: true,
    showHeader: true,
    highlightCurrentRow: true,
    content: '表格内容'
  },
  argTypes: meta.argTypes,
  render: (args) => ({
    components: { UTable },
    setup() {
      const handleCurrentChange = (currentRow: any) => {
        console.log('当前行变化', currentRow)
      }
      const handleSelect = (selection: any[], row: any) => {
        console.log('选择项变化', selection, row)
      }
      const handleSelectAll = (selection: any[]) => {
        console.log('全选变化', selection)
      }
      const handleSortChange = ({ column, prop, order }: any) => {
        console.log('排序变化', column, prop, order)
      }
      return { 
        args, 
        handleCurrentChange, 
        handleSelect, 
        handleSelectAll, 
        handleSortChange 
      }
    },
    template: container(`
      <div>
        <p>{{ args.content }}</p>
        <UTable 
          v-bind="args"
          @current-change="handleCurrentChange"
          @select="handleSelect"
          @select-all="handleSelectAll"
          @sort-change="handleSortChange"
        />
      </div>
    `)
  })
}

export default meta 