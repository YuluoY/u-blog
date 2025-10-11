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
  const isSingle = props?.single ?? true

  let container = (isString(props?.appendTo) ? document.querySelector(props.appendTo) : props?.appendTo) || document.body

  if (!isSingle)
  {
    const div = document.createElement('div')
    container.appendChild(div)
    container = div
  }

  const openDebounce = debounce(open, props?.openDelay || 100)
  const closeDebounce = debounce(close, props?.closeDelay || 100)

  const _props = {
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
    render(h(DialogSFC, _props), container)
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