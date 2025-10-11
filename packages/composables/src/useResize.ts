import { isArray, isPlainObject, isString, merge } from 'lodash-es'
import { nextTick, Fragment, computed, h, isRef, onBeforeUnmount, ref, render, type CSSProperties, type Ref, type VNode } from 'vue'

interface UseResizeOptions {
  el: string | HTMLElement | Ref<HTMLElement | null>
  angleWidth?: number      // 对角控制条的宽度
  barSize?: number       // 控制条的大小
  barZIndex?: number      // 控制条的z-index
  minHeight?: number      // 最小高度
  minWidth?: number       // 最小宽度
  resizing?: (width: number, height: number) => void
  end?: (width: number, height: number) => void
}

type ResizeType = typeof ResizeClasses[keyof typeof ResizeClasses]

interface UseResizeReturn {
  width: Readonly<Ref<number>>
  height: Readonly<Ref<number>>
  left: Readonly<Ref<number>>
  top: Readonly<Ref<number>>
  startX: Readonly<Ref<number>>
  startY: Readonly<Ref<number>>
  startWidth: Readonly<Ref<number>>
  startHeight: Readonly<Ref<number>>
  resizeType: Readonly<Ref<ResizeType>>
}

const ResizeClasses: {
  [key: string]: string
} = {
  TOP: 'v-resize-t',
  BOTTOM: 'v-resize-b',
  LEFT: 'v-resize-l',
  RIGHT: 'v-resize-r',
  TOP_LEFT: 'v-resize-tl',
  TOP_RIGHT: 'v-resize-tr',
  BOTTOM_LEFT: 'v-resize-bl',
  BOTTOM_RIGHT: 'v-resize-br',
}

const ResizeCursors: {
  [key: string]: string
} = {
  [ResizeClasses.TOP]: 'n-resize',
  [ResizeClasses.BOTTOM]: 's-resize',
  [ResizeClasses.LEFT]: 'w-resize',
  [ResizeClasses.RIGHT]: 'e-resize',
  [ResizeClasses.TOP_LEFT]: 'nw-resize',
  [ResizeClasses.TOP_RIGHT]: 'ne-resize',
  [ResizeClasses.BOTTOM_LEFT]: 'sw-resize',
  [ResizeClasses.BOTTOM_RIGHT]: 'se-resize',
}

/**
 *
 * @param opts
 * @param opts.el 需要调整大小的元素
 * @param opts.angleWidth 对角控制条的宽度
 * @param opts.barSize 控制条的大小
 * @param opts.barZIndex 控制条的z-index
 * @param opts.minWidth 最小宽度
 * @param opts.minHeight 最小高度
 * @param opts.resizing 调整大小时触发的事件
 * @param opts.end 调整大小时触发的事件
 * @description 用于调整元素的大小
 * @example
 * ```ts
 * const { width, height, left, top, startX, startY, startWidth, startHeight, resizeType } = useResize({
 *   el: '#app',
 * })
 * ```
 *
 * @returns
 */
export function useResize(opts: UseResizeOptions): UseResizeReturn
{

  const defaultOpts = merge({
    angleWidth: 8,
    barSize: 5,
    barZIndex: 999,
    minWidth: 0,
    minHeight: 0
  } as UseResizeOptions, opts)

  const {
    el,
    minWidth,
    minHeight
  } = defaultOpts

  const target = getDOM(el)
  if (!target)
    throw new Error('el is required')

  window.requestAnimationFrame(() =>
  {
    target.style.position = 'relative'
    target.style.willChange = 'width, height, left, top'
  })

  const isPress = ref(false)
  const startX = ref(0)
  const startY = ref(0)
  const startWidth = ref(0)
  const startHeight = ref(0)
  const resizeType = ref('')
  const rect = ref(target.getBoundingClientRect())

  const onMousedown = (e: MouseEvent) =>
  {
    isPress.value = true
    const t = e.target as HTMLElement
    startX.value = e.clientX
    startY.value = e.clientY
    startWidth.value = target.offsetWidth
    startHeight.value = target.offsetHeight
    resizeType.value = t.classList[0]
  }

  const onMousemove = (e: MouseEvent) =>
  {
    if (!isPress.value)
      return
    e.preventDefault()
    const dx = e.clientX - startX.value
    const dy = e.clientY - startY.value
    handleResize(target, resizeType.value, {
      dx,
      dy,
      startX: startX.value,
      startY: startY.value,
      startWidth: startWidth.value,
      startHeight: startHeight.value,
      minWidth: minWidth!,
      minHeight: minHeight!
    })
    nextTick(() =>
    {
      rect.value = target.getBoundingClientRect()
      opts.resizing?.(rect.value.width, rect.value.height)
    })
  }

  const onMouseup = () =>
  {
    isPress.value = false
  }
 
  window.addEventListener('mousemove', onMousemove, { passive: false })
  window.addEventListener('mouseup', onMouseup, { passive: true })

  const controlVNodes = getControlVNodes(defaultOpts, {
    onMousedown
  })

  renders(controlVNodes, target)

  onBeforeUnmount(() =>
  {
    window.removeEventListener('mousemove', onMousemove)
    window.removeEventListener('mouseup', onMouseup)
  })

  return {
    width: computed(() => rect.value.width),
    height: computed(() => rect.value.height),
    left: computed(() => rect.value.left),
    top: computed(() => rect.value.top),
    startX: computed(() => startX.value),
    startY: computed(() => startY.value),
    startWidth: computed(() => startWidth.value),
    startHeight: computed(() => startHeight.value),
    resizeType: computed(() => resizeType.value),
  }
}

function handleResize(
  target: HTMLElement,
  resizeType: ResizeType,
  opts: Record<string, number>
)
{
  const {
    dx,
    dy,
    startX,
    startY,
    startWidth,
    startHeight,
    minWidth,
    minHeight
  } = opts
  window.requestAnimationFrame(() =>
  {
    switch (resizeType)
    {
    case ResizeClasses.TOP:
    {
      const height = startHeight - dy
      const top = startY + dy
      if (height < minHeight! || top < 0)
        return
      target.style.height = `${height}px`
      target.style.top = `${top}px`
      break
    }
    case ResizeClasses.BOTTOM:
    {
      const height = startHeight + dy
      if (height < minHeight!)
        return
      target.style.height = `${height}px`
      break
    }
    case ResizeClasses.LEFT:
    {
      const width = startWidth - dx
      const left = startX + dx
      if (width < minWidth! || left < 0)
        return
      target.style.width = `${width}px`
      target.style.left = `${left}px`
      break
    }
    case ResizeClasses.RIGHT:
    {
      const width = startWidth + dx
      if (width < minWidth!)
        return
      target.style.width = `${startWidth + dx}px`
      break
    }
    case ResizeClasses.TOP_LEFT:
      handleResize(target, ResizeClasses.LEFT, opts)
      handleResize(target, ResizeClasses.TOP, opts)
      break
    case ResizeClasses.TOP_RIGHT:
      handleResize(target, ResizeClasses.RIGHT, opts)
      handleResize(target, ResizeClasses.TOP, opts)
      break
    case ResizeClasses.BOTTOM_LEFT:
      handleResize(target, ResizeClasses.LEFT, opts)
      handleResize(target, ResizeClasses.BOTTOM, opts)
      break
    case ResizeClasses.BOTTOM_RIGHT:
      handleResize(target, ResizeClasses.RIGHT, opts)
      handleResize(target, ResizeClasses.BOTTOM, opts)
      break
    default:
      break
    }
  })
}

function getDOM(el: UseResizeOptions['el']): HTMLElement | null
{
  const target: HTMLElement | null = isString(el) ? document.querySelector(el) :
    el instanceof HTMLElement ? el :
      isRef(el) ? el.value : null
  return target
}

function getControlVNodes(
  opts: UseResizeOptions,
  props?: any
): {
  [key:string]: VNode
  Top: VNode
  Bottom: VNode
  Left: VNode
  Right: VNode
  TopLeft: VNode
  TopRight: VNode
  BottomLeft: VNode
  BottomRight: VNode
}
{

  const {
    barSize,
    angleWidth,
    barZIndex
  } = opts

  const commonStyles: CSSProperties = {
    position: 'absolute',
    zIndex: barZIndex
  }
  const Top = h('div', {
    class: ResizeClasses.TOP,
    style: {
      ...commonStyles,
      top: 0,
      left: angleWidth + 'px',
      width: `calc(100% - ${angleWidth! * 2}px)`,
      height: `${barSize}px`,
      cursor: ResizeCursors[ResizeClasses.TOP]
    },
    ...props
  })

  const Bottom = h('div', {
    class: ResizeClasses.BOTTOM,
    style: {
      ...commonStyles,
      bottom: 0,
      left: angleWidth + 'px',
      width: `calc(100% - ${angleWidth! * 2}px)`,
      height: `${barSize}px`,
      cursor: ResizeCursors[ResizeClasses.BOTTOM]
    },
    ...props
  })

  const Left = h('div', {
    class: ResizeClasses.LEFT,
    style: {
      ...commonStyles,
      left: 0,
      top: angleWidth + 'px',
      width: `${barSize}px`,
      height: `calc(100% - ${angleWidth! * 2}px)`,
      cursor: ResizeCursors[ResizeClasses.LEFT]
    },
    ...props
  })

  const Right = h('div', {
    class: ResizeClasses.RIGHT,
    style: {
      ...commonStyles,
      right: 0,
      top: angleWidth + 'px',
      width: `${barSize}px`,
      height: `calc(100% - ${angleWidth! * 2}px)`,
      cursor: ResizeCursors[ResizeClasses.RIGHT]
    },
    ...props
  })

  const TopLeft = h('div', {
    class: ResizeClasses.TOP_LEFT,
    style: {
      ...commonStyles,
      top: 0,
      left: 0,
      width: `${angleWidth}px`,
      height: `${angleWidth}px`,
      cursor: ResizeCursors[ResizeClasses.TOP_LEFT]
    },
    ...props
  })

  const TopRight = h('div', {
    class: ResizeClasses.TOP_RIGHT,
    style: {
      ...commonStyles,
      top: 0,
      right: 0,
      width: `${angleWidth}px`,
      height: `${angleWidth}px`,
      cursor: ResizeCursors[ResizeClasses.TOP_RIGHT]
    },
    ...props
  })

  const BottomLeft = h('div', {
    class: ResizeClasses.BOTTOM_LEFT,
    style: {
      ...commonStyles,
      bottom: 0,
      left: 0,
      width: `${angleWidth}px`,
      height: `${angleWidth}px`,
      cursor: ResizeCursors[ResizeClasses.BOTTOM_LEFT]
    },
    ...props
  })

  const BottomRight = h('div', {
    class: ResizeClasses.BOTTOM_RIGHT,
    style:{
      ...commonStyles,
      bottom: 0,
      right: 0,
      width: `${angleWidth}px`,
      height: `${angleWidth}px`,
      cursor: ResizeCursors[ResizeClasses.BOTTOM_RIGHT]
    },
    ...props
  })

  return {
    Top,
    Bottom,
    Left,
    Right,
    TopLeft,
    TopRight,
    BottomLeft,
    BottomRight
  }
}

function renders(vnodes: Record<string, VNode> | VNode[], target: HTMLElement)
{
  if (isArray(vnodes))
  
    render(h(Fragment, null, vnodes), target)
  
  else if (isPlainObject(vnodes))
  
    renders(Object.values(vnodes), target)
  
}