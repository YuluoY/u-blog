import type { Meta } from '@storybook/vue3'
import { UCard } from 'ucc-ui'
import type { ExtraContent, Story } from './types'
import type { UCardProps } from '../../../components/card/types'
import { container } from './utils'
import { CCardShadow } from '../../../components/card/types/const'

const meta: Meta<typeof UCard> = {
  title: 'Components/Card',
  component: UCard,
  tags: ['autodocs']
}

export const Default: Story<typeof UCard> = {
  argTypes: {
    header: {
      control: { type: 'text' },
      description: '头部内容'
    },
    footer: {
      control: { type: 'text' },
      description: '底部内容'
    },
    shadow: {
      control: { type: 'select' },
      description: '阴影出现时机',
      options: Object.values(CCardShadow),
    },
    padding: {
      control: { type: 'number' },
      description: '内边距'
    },
    bodyClass: {
      control: { type: 'text' },
      description: 'body类名'
    },
    bodyStyle: {
      control: { type: 'object' },
      description: 'body样式'
    }
  },
  args: {
    shadow: 'never',
    bodyClass: '',
    bodyStyle: {},
    padding: 15,
    header: 'sadasd',
    footer: 'asdasd'
  },
  render: (args: UCardProps & ExtraContent) => ({
    components: { UCard },
    setup()
    {
      return { args }
    },
    template: container(`
      <u-card v-bind="args">
        <template #header>
          header
        </template>
        ${args.shadow}
        <template #footer>
          footer
        </template>
      </u-card>

      <u-card v-bind="args" class="mt-20">
        ${args.shadow}
      </u-card>
    `),
  })
}

export default meta