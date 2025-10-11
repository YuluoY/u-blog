import { withInstallFunc } from '@/utils' 
import { defineComponent } from 'vue'
import { isFunction } from 'lodash-es'
import MessageFn from './methods'
import { CGlobal } from '../constants'

export const RenderVNode = defineComponent({
  props: {
    vnode: {
      type: [String, Object, Function],
      required: true
    }
  },
  setup(props)
  {
    return () => isFunction(props.vnode) ? props.vnode() : props.vnode
  }
})

export * from './types'
export * from './consts'
export const UMessageFn = withInstallFunc(MessageFn, CGlobal.MESSAGE)

