/**
 * 全局方法
 */
export const CGlobal =
{
  DIALOG: '$dialog',  // finished
  MESSAGE: '$message', // finished
  LOADING: '$loading', // undo
  NOTIFICATION: '$notify', // dev ing
  CONFIRM: '$confirm', // undo
  PROGRESS: '$progress' // finished
} as const

export type Global = typeof CGlobal[keyof typeof CGlobal]