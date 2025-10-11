import type { Meta } from '@storybook/vue3'
import { UTimeline } from 'ucc-ui'
import 'ucc-ui/dist/index.css'
import type { Story } from './types'
import { container } from './utils'
import { CTimelineDirection, CTimelineContextKey } from '../../../components/timeline/types/const'
import { provide } from 'vue'

const meta: Meta<typeof UTimeline> = {
  title: 'Components/Timeline',
  component: UTimeline,
  tags: ['autodocs'],
  decorators: [
    () => ({
      template: '<story />',
      setup()
      {
        provide(CTimelineContextKey, {
          onCalcLine: () =>
          {}
        })
      }
    })
  ],
  argTypes: {
    data: {
      control: 'object',
      description: '时间线数据'
    },
    direction: {
      control: 'select',
      options: Object.values(CTimelineDirection),
      description: '时间线方向'
    },
    gutter: {
      control: 'number',
      description: '时间线间隔'
    },
    margin: {
      control: 'number',
      description: '时间线边距'
    },
    lineColor: {
      control: 'color',
      description: '时间线颜色'
    }
  }
}

export const Default: Story<typeof UTimeline> = {
  args: {
    data: [
      {
        content: '创建服务站点',
        date: '2024-01-01',
        type: 'primary',
        placement: 'top'
      },
      {
        content: '初步完成',
        date: '2024-01-15',
        type: 'success',
        placement: 'top'
      },
      {
        content: '正在处理',
        date: '2024-01-30',
        type: 'warning',
        placement: 'top'
      },
      {
        content: '已完成',
        date: '2024-02-15',
        type: 'success',
        placement: 'top'
      }
    ],
    direction: 'vertical',
    gutter: 30,
    margin: 20,
    lineColor: ''
  },
  argTypes: meta.argTypes as any,
  render: args => ({
    components: { UTimeline },
    setup()
    {
      return { args }
    },
    template: container(`
      <UTimeline 
        :data="args.data"
        :direction="args.direction"
        :gutter="args.gutter"
        :margin="args.margin"
        :line-color="args.lineColor"
      />
    `)
  })
}

export default meta