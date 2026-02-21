import { h, render } from 'vue'
import DialogSFC from './src/Dialog.vue'
import type { UDialogProps } from './types'
import { debounce, isFunction, isString } from 'lodash-es'
import { getNextZIndex } from './cache'

export interface UDialogFnProps {
  single?: boolean
  confirm?: () => Promise<boolean>
}

export interface UDialogFnReturn {
  close: () => void
}

const DialogFn = (props: UDialogProps & UDialogFnProps = {}): UDialogFnReturn =>
{
  const appContext = (DialogFn as any)._context
  const isSingle = props?.single ?? true

  const appendTarget = (isString(props?.appendTo) ? document.querySelector(props.appendTo) : props?.appendTo) || document.body
  const wrapperDiv = document.createElement('div')
  appendTarget.appendChild(wrapperDiv)
  let container: Element = wrapperDiv
  if (!isSingle)
  {
    const div = document.createElement('div')
    wrapperDiv.appendChild(div)
    container = div
  }
  else
  {
    container = wrapperDiv
  }

  const openDebounce = debounce(open, props?.openDelay || 100)
  const closeDebounce = debounce(close, props?.closeDelay || 100)

  const _props = {
    modelValue: true, // 函数式调用时默认打开弹窗，否则 Dialog 内部 visible 为 false 不显示
    ...props,
    zIndex: getNextZIndex(),
    open: openDebounce,
    close: closeDebounce,
    onConfirm: async(close: () => void) =>
    {
      if (isFunction(props.confirm))
      {
        const res = await props.confirm()
        if (res) close()
      }
      else
        close()
    }
  } as any

  function open()
  {
    const vnode = h(DialogSFC, _props)
    if (appContext) (vnode as any).appContext = appContext
    render(vnode, container)
    !isSingle && container.remove()
  }

  function close()
  {
    render(null, container)
  }

  isSingle && close()
  open()

  return {
    close
  }
}

export default DialogFn