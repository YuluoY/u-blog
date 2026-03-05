/**
 * 敏感词过滤器 —— 基于 DFA（确定有限自动机） 实现
 *
 * 核心思路：将敏感词库构建为一棵 Trie 前缀树，
 * 对输入文本逐字符在树上匹配，命中的片段替换为 '*'。
 *
 * 时间复杂度 O(n)（n = 输入文本长度），空间换时间。
 */

/* ========== Trie 节点 ========== */
interface TrieNode {
  children: Map<string, TrieNode>
  /** 是否为某个敏感词的终止节点 */
  isEnd: boolean
}

function createNode(): TrieNode
{
  return { children: new Map(), isEnd: false }
}

/* ========== 构建 Trie ========== */
function buildTrie(words: string[]): TrieNode
{
  const root = createNode()
  for (const word of words)
  {
    if (!word) continue
    let cur = root
    for (const ch of word)
    {
      const key = ch.toLowerCase()
      if (!cur.children.has(key))
      
        cur.children.set(key, createNode())
      
      cur = cur.children.get(key)!
    }
    cur.isEnd = true
  }
  return root
}

/* ========== 敏感词库（侮辱、脏话、涉政等常见词汇） ========== */
const SENSITIVE_WORDS: string[] = [
  // 常见脏话 / 侮辱
  '傻逼', '煞笔', '沙比', '傻比', '操你妈', '草你妈', '你妈逼',
  '妈的', '他妈的', '他妈', '我操', '卧槽', '日你妈',
  '妈了个逼', '滚你妈', '去你妈', '我日', '狗日的', '狗逼',
  '贱人', '贱逼', '废物', '垃圾', '白痴', '弱智', '脑残',
  '智障', '猪头', '混蛋', '王八蛋', '畜生', '杂种',
  '蠢猪', '蠢货', '笨蛋', '二逼', '二货', 'sb', 'SB',
  '尼玛', '你妈', '你麻痹', '麻痹', '妈逼',
  '滚蛋', '去死', '找死', '该死', '死全家',
  'fuck', 'shit', 'damn', 'bitch', 'asshole', 'dick', 'pussy',
  'motherfucker', 'wtf', 'stfu',
  // 歧视
  '黑鬼', '支那', '蝗虫',
  // 涉赌涉黄
  '赌博', '博彩', '色情', '裸聊', '一夜情',
  '约炮', '嫖娼', '卖淫',
]

/** DFA 根节点（模块加载时一次性构建） */
const trieRoot = buildTrie(SENSITIVE_WORDS)

/* ========== 对外接口 ========== */

/**
 * 检测并替换文本中的敏感词为 '*'
 * @param text - 待过滤文本
 * @param mask - 替换字符，默认 '*'
 * @returns 过滤后的文本
 */
export function filterSensitiveWords(text: string, mask = '*'): string
{
  if (!text) return text
  const chars = [...text]
  const len = chars.length
  const result = [...chars]

  for (let i = 0; i < len; i++)
  {
    let cur = trieRoot
    let j = i
    let lastMatchEnd = -1

    // 从位置 i 开始，在 Trie 上做最长匹配
    while (j < len)
    {
      const key = chars[j].toLowerCase()
      const next = cur.children.get(key)
      if (!next) break
      cur = next
      if (cur.isEnd)
      
        lastMatchEnd = j
      
      j++
    }

    // 如果找到匹配，替换对应位置的字符
    if (lastMatchEnd >= i)
    {
      for (let k = i; k <= lastMatchEnd; k++)
      
        result[k] = mask
      
      i = lastMatchEnd // 外层 for 的 i++ 会让指针前移到 lastMatchEnd + 1
    }
  }

  return result.join('')
}

/**
 * 检测文本中是否包含敏感词
 * @param text - 待检测文本
 * @returns 是否包含敏感词
 */
export function hasSensitiveWords(text: string): boolean
{
  if (!text) return false
  const chars = [...text]
  const len = chars.length

  for (let i = 0; i < len; i++)
  {
    let cur = trieRoot
    let j = i

    while (j < len)
    {
      const key = chars[j].toLowerCase()
      const next = cur.children.get(key)
      if (!next) break
      cur = next
      if (cur.isEnd) return true
      j++
    }
  }
  return false
}

/**
 * 运行时动态追加敏感词（热更新场景）
 * @param words - 待追加的敏感词数组
 */
export function addSensitiveWords(words: string[]): void
{
  for (const word of words)
  {
    if (!word) continue
    let cur = trieRoot
    for (const ch of word)
    {
      const key = ch.toLowerCase()
      if (!cur.children.has(key))
      
        cur.children.set(key, createNode())
      
      cur = cur.children.get(key)!
    }
    cur.isEnd = true
  }
}
