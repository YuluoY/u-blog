/**
 * 向上追溯父节点
 * @author      Yuluo  {@link https://github.com/YuluoY}
 * @date        2024-08-24
 * @param       {Node}                            node            节点
 * @param       {(node: ParentNode) => boolean}   condition       条件
 * @param       {number}                          [max]           最大追溯次数
 * @returns     {ParentNode | null}
 * @example
 * ```ts
 * const node = document.querySelector('div')
 * traceParentNode(node, (node) => node.nodeName === 'BODY')
 * // => <body>...</body>
 * ```
 */
export const traceParentNode = (
   
  node: ParentNode,
  condition: (node: Node) => boolean,
  max: number = 10
 
): ParentNode | HTMLElement | null =>
{
  if (max <= 0 || node.nodeName === '#document') return null
  if (condition(node)) return node
   
  return traceParentNode(node?.parentNode as ParentNode, condition, max - 1)
}
