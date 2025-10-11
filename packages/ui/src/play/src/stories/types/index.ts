import type { ArgTypes, StoryObj } from '@storybook/vue3'

export interface ExtraContent {
  content?: string
}
export type ArgsContent = { args: { content: string } }
export type Story<C> = StoryObj<C> & { argTypes: ArgTypes }
export type StoryPlus<C> = Story<C> & ArgsContent