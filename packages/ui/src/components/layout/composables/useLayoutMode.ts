import { computed, Fragment, h, type ComputedRef, type FunctionalComponent, type SetupContext, type VNode } from 'vue'
import type { ULayoutProps } from '../types'
import { CLayoutExtend, CLayoutMode, CRegion } from '../consts'

interface IClassifyNodes {
  topRegions: VNode[];
  leftRegions: VNode[];
  centerRegions: VNode[];
  rightRegions: VNode[];
  bottomRegions: VNode[];
  others: VNode[];
}

type FnVNode = FunctionalComponent | VNode;

export const useLayoutMode = ({
  props,
  slots
}:{
  props: ULayoutProps,
  slots: SetupContext['slots']
}): {
  processedSlot: ComputedRef<FnVNode>;
}=>
{
  
  const isNotExtend = computed(() => !props.extend)
  const isLeftTopExtend = computed(() => props.extend === CLayoutExtend.LEFT_TOP)
  const isLeftBottomExtend = computed(() => props.extend === CLayoutExtend.LEFT_BOTTOM)
  const isRightTopExtend = computed(() => props.extend === CLayoutExtend.RIGHT_TOP)
  const isRightBottomExtend = computed(() => props.extend === CLayoutExtend.RIGHT_BOTTOM)
  const isLeftExtend = computed(() => props.extend === CLayoutExtend.LEFT)
  const isRightExtend = computed(() => props.extend === CLayoutExtend.RIGHT)
  const isBothExtend = computed(() => props.extend === CLayoutExtend.BOTH)

  const processedSlot = computed(() =>
  {

    const nodes = slots.default?.() || []
    // 如果不是默认布局模式，直接返回
    if (!nodes || props.mode !== CLayoutMode.DEFAULT)
      return () => nodes
   
    // 分类子元素
    const n = classfiyNodes(nodes)
  
    if (isNotExtend.value)
      return processNotExtend(n)
    else if (isLeftTopExtend.value)
      return processLeftTopExtend(props, n)
    else if (isRightTopExtend.value)
      return processRightTopExtend(props, n)
    else if (isLeftBottomExtend.value)
      return processLeftBottomExtend(props, n)
    else if (isRightBottomExtend.value)
      return processRightBootomExtend(props, n)
    else if (isLeftExtend.value)
      return processLeftExtend(props, n)
    else if (isRightExtend.value)
      return processRightExtend(props, n)
    else if (isBothExtend.value)
      return processBothExtend(props, n)
  
    return nodes
  })
  
  return {
    processedSlot: processedSlot as ComputedRef<FnVNode>
  }
}

function processNotExtend(n: IClassifyNodes): FnVNode
{
  return addFragment(
    [
      h(Fragment, null, n.topRegions),
      addLayoutBody(
        [
          h(Fragment, null, n.leftRegions),
          h(Fragment, null, n.centerRegions),
          h(Fragment, null, n.rightRegions),
        ]
      ),
      h(Fragment, null, n.bottomRegions)
    ]
  )
}

function processLeftTopExtend(props: ULayoutProps, n: IClassifyNodes): FnVNode
{
  return addFragment(
    [
      addLayoutCont(
        props.mode,
        [
          h(Fragment, null, n.leftRegions),
          addLayoutBody(
            [
              h(Fragment, null, n.topRegions),
              addLayoutBodyCenter(h(Fragment, null, [...n.centerRegions, ...n.rightRegions]))
            ]
          )
        ]
      ),
      h(Fragment, null, n.bottomRegions)
    ]
  )
}

function processRightTopExtend(props: ULayoutProps, n: IClassifyNodes): FnVNode
{
  return addFragment(
    [
      addLayoutCont(
        props.mode,
        [
          addLayoutBody(
            [
              h(Fragment, null, n.topRegions),
              addLayoutBodyCenter(h(Fragment, null, [...n.leftRegions, ...n.centerRegions]))
            ]
          ),
          h(Fragment, null, n.rightRegions)
        ]
      ),
      h(Fragment, null, n.bottomRegions)
    ]
  )
}

function processLeftBottomExtend(props: ULayoutProps, n: IClassifyNodes): VNode
{
  return addLayoutCont(
    props.mode,
    [
      h(Fragment, null, n.topRegions),
      addLayoutBody(
        [
          h(Fragment, null, n.leftRegions),
          addLayoutBodyCenter(
            [
              addLayoutBodyCenterContent(h(Fragment, null, [...n.centerRegions, ...n.rightRegions])),
              h(Fragment, null, n.bottomRegions)
            ]
          )
        ]
      )
    ]
  )
}

function processRightBootomExtend(props: ULayoutProps, n: IClassifyNodes): VNode
{
  return addLayoutCont(
    props.mode,
    [
      h(Fragment, null, n.topRegions),
      addLayoutBody(
        [
          addLayoutBodyCenter(
            [
              addLayoutBodyCenterContent(h(Fragment, null, [...n.leftRegions, ...n.centerRegions])),
              h(Fragment, null, n.bottomRegions)
            ]
          ),
          h(Fragment, null, n.rightRegions)
        ]
      )
    ]
  )
}

function processLeftExtend(props: ULayoutProps, n: IClassifyNodes): VNode
{
  return addLayoutCont(
    props.mode,
    [
      h(Fragment, null, n.leftRegions),
      addLayoutBody(
        [
          h(Fragment, null, n.topRegions),
          addLayoutBodyCenter(
            [
              addLayoutBodyCenterContent(h(Fragment, null, [...n.centerRegions, ...n.rightRegions])),
              h(Fragment, null, n.bottomRegions)
            ]
          )
        ]
      )
    ]
  )
}

function processRightExtend(props: ULayoutProps, n: IClassifyNodes): VNode
{
  return addLayoutCont(
    props.mode,
    [
      addLayoutBody(
        [
          h(Fragment, null, n.topRegions),
          addLayoutBodyCenter(
            [
              addLayoutBodyCenterContent(h(Fragment, null, [...n.leftRegions, ...n.centerRegions])),
              h(Fragment, null, n.bottomRegions)
            ]
          )
        ]
      ),
      h(Fragment, null, n.rightRegions)
    ]
  )
}

function processBothExtend(props: ULayoutProps, n: IClassifyNodes): VNode
{
  return addLayoutCont(
    props.mode,
    [
      h(Fragment, null, n.leftRegions),
      addLayoutBody(h(Fragment, null, [...n.topRegions, ...n.centerRegions, ...n.bottomRegions])),
      h(Fragment, null, n.rightRegions)
    ]
  )
}

function classfiyNodes(nodes: VNode[]): IClassifyNodes
{
  const topRegions: VNode[] = []
  const leftRegions: VNode[] = []
  const centerRegions: VNode[] = []
  const rightRegions: VNode[] = []
  const bottomRegions: VNode[] = []
  const others: VNode[] = []

  for (let i = 0; i < nodes.length; i++)
  {
    const node = nodes[i]
    const region = node.props?.region
    if (!region)
    {
      others.push(node)
      continue
    }
    switch (region)
    {
    case CRegion.TOP: topRegions.push(node); break
    case CRegion.LEFT: leftRegions.push(node); break
    case CRegion.CENTER: centerRegions.push(node); break
    case CRegion.RIGHT: rightRegions.push(node); break
    case CRegion.BOTTOM: bottomRegions.push(node); break
    default: break
    }
  }

  return {
    topRegions,
    leftRegions,
    centerRegions,
    rightRegions,
    bottomRegions,
    others
  }
}

function addFragment(child: VNode[]): FnVNode
{
  return () => h(
    Fragment,
    null,
    child
  )
}

function addLayoutCont(mode: ULayoutProps['mode'], child: VNode | VNode[]): VNode
{
  return h(
    'div',
    { class: `u-layout-mode u-layout-mode__${mode}`},
    child
  )
}

function addLayoutBody(child: VNode | VNode[]): VNode
{
  return h(
    'div',
    { class: 'u-layout__body' },
    child
  )
}

function addLayoutBodyCenter(child: VNode | VNode[]): VNode
{
  return h(
    'div',
    { class: 'u-layout__body-center' },
    child
  )
}

function addLayoutBodyCenterContent(child: VNode | VNode[]): VNode
{
  return h(
    'div',
    { class: 'u-layout__body-center-content' },
    child
  )
}