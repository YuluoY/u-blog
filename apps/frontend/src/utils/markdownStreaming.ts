/**
 * 修复流式传输时 markdown 渲染不一致问题：
 * 当 SSE 逐 token 拼接内容时，未闭合的代码围栏(```)会导致
 * 后续所有内容都被当作代码块渲染，产生"一部分代码一部分 md"的混合效果。
 * 此函数在渲染前检测并临时补全未闭合的语法结构。
 */
export function normalizeStreamingMarkdown(content: string, isStreaming: boolean): string
{
  if (!content) return ' '

  // 仅在流式传输中的最后一条消息需要修复
  if (!isStreaming) return content

  let result = content

  // 1. 修复未闭合的代码围栏（```）
  //    匹配行首的 ``` 标记（可带语言标识），计算奇偶性
  const fenceRegex = /^`{3,}/gm
  const fences = result.match(fenceRegex)
  if (fences && fences.length % 2 !== 0)
  {
    // 奇数个围栏 → 有一个未闭合的代码块，追加闭合围栏
    result += '\n```'
  }

  // 2. 修复未闭合的行内代码（单个 `）
  //    先剔除代码围栏区域，再检测剩余内容中的单反引号奇偶性
  const withoutFences = result.replace(/```[\s\S]*?```/g, '')
  const inlineBackticks = withoutFences.match(/(?<!`)`(?!`)/g)
  if (inlineBackticks && inlineBackticks.length % 2 !== 0)
  
    result += '`'
  

  return result
}
