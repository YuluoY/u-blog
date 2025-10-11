// 预编译的正则表达式，提升性能
export const ChunkStringRegExp = /.{1,(\d+)}/g

/**
 * 将字符串按指定长度分块并插入分隔符
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-03-04
 * @param       {string}  str  - 字符串
 * @param       {number}  count  - 每块的长度
 * @param       {string}  [separator='\n']  - 分隔符
 * @returns     {string}
 * @example
 * ```ts
 * const str = '1234567890'
 * const result = chunkString(str, 3) // '123\n456\n789\n0'
 *
 * const str2 = '1234567890'
 * const result2 = chunkString(str2, 3, '-') // '123-456-789-0'
 * ```
 */
export const chunkString = (str: string, count: number, separator = '\n'): string =>
{
  // 输入验证
  if (!str || typeof str !== 'string') {
    return ''
  }
  
  if (count <= 0 || !Number.isInteger(count)) {
    return str
  }
  
  // 使用预编译的正则表达式提高性能
  const chunks = str.match(ChunkStringRegExp) || []
  
  return chunks.join(separator)
}