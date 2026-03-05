import type { ChatSession } from '@/stores/chat'

/* ====================================================================
 * useChatRAG — 轻量级前端 RAG（检索增强生成）
 *
 * 原理：
 * 1. 对用户输入进行分词
 * 2. 基于 BM25 算法在所有历史会话中检索相关片段
 * 3. 将匹配到的上下文拼接为文本，传给后端注入系统提示词
 *
 * 优势：
 * - 纯前端运行，无需额外 API 调用
 * - 支持中英文混合分词
 * - 零依赖，开箱即用
 * ==================================================================== */

/** 检索结果条目 */
export interface RAGResult {
  /** 来源会话标题 */
  sessionTitle: string
  /** 消息角色 */
  role: 'user' | 'assistant'
  /** 消息内容（可能截断） */
  content: string
  /** BM25 相关性分数 */
  score: number
}

/* ========== 分词器 ========== */

/** 中文字符 Unicode 范围 */
const CJK_RANGE = /[\u4e00-\u9fff\u3400-\u4dbf]/g
/** 英文/数字单词 */
const WORD_RANGE = /[a-zA-Z0-9_]+/g
/** 停用词集合（高频低信息量词） */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'to', 'of',
  'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'out', 'off',
  'up', 'down', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both',
  'either', 'neither', 'each', 'every', 'all', 'any', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than',
  'too', 'very', 'just', 'because', 'if', 'when', 'while', 'although',
  'this', 'that', 'these', 'those', 'it', 'its', 'i', 'me', 'my', 'we',
  'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them',
  '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一',
  '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着',
  '没有', '看', '好', '自己', '这', '他', '么', '那', '被', '她',
  '吗', '什么', '让', '把', '能', '对', '还', '吧', '啊', '呢',
])

/**
 * 对文本进行中英文混合分词
 * - 中文：按单字拆分（unigram）
 * - 英文：按空格/标点分割为单词
 * - 过滤停用词和单字符英文
 */
function tokenize(text: string): string[]
{
  const lower = text.toLowerCase()
  const tokens: string[] = []

  // 提取中文单字
  const cjkMatches = lower.match(CJK_RANGE)
  if (cjkMatches)
  {
    cjkMatches.forEach(ch =>
    {
      if (!STOP_WORDS.has(ch)) tokens.push(ch)
    })
  }

  // 提取英文单词
  const wordMatches = lower.match(WORD_RANGE)
  if (wordMatches)
  {
    wordMatches.forEach(w =>
    {
      if (w.length > 1 && !STOP_WORDS.has(w)) tokens.push(w)
    })
  }

  return tokens
}

/* ========== BM25 检索引擎 ========== */

/** BM25 参数 */
const K1 = 1.2
const B = 0.75
/** 单条消息最大检索长度（避免处理超长文本） */
const MAX_CONTENT_LEN = 2000
/** 返回结果中每条内容的最大字符数 */
const MAX_RESULT_CONTENT = 500

interface DocEntry {
  sessionTitle: string
  role: 'user' | 'assistant'
  content: string
  tokens: string[]
  tfMap: Map<string, number>
  docLen: number
}

/**
 * 构建 BM25 文档索引
 */
function buildIndex(sessions: ChatSession[], excludeSessionId?: string | null): DocEntry[]
{
  const docs: DocEntry[] = []

  for (const session of sessions)
  {
    // 跳过当前会话（避免自己检索自己）
    if (excludeSessionId && session.id === excludeSessionId) continue
    if (!session.messages?.length) continue

    for (const msg of session.messages)
    {
      const content = msg.content.slice(0, MAX_CONTENT_LEN)
      if (content.length < 10) continue // 跳过过短内容

      const tokens = tokenize(content)
      if (tokens.length === 0) continue

      // 计算词频 (TF)
      const tfMap = new Map<string, number>()
      for (const t of tokens)
      
        tfMap.set(t, (tfMap.get(t) || 0) + 1)
      

      docs.push({
        sessionTitle: session.title,
        role: msg.role,
        content,
        tokens,
        tfMap,
        docLen: tokens.length,
      })
    }
  }

  return docs
}

/**
 * BM25 检索
 */
function bm25Search(query: string, docs: DocEntry[], topK: number): RAGResult[]
{
  const queryTokens = tokenize(query)
  if (queryTokens.length === 0 || docs.length === 0) return []

  const N = docs.length
  const avgDl = docs.reduce((sum, d) => sum + d.docLen, 0) / N

  // 计算 IDF (逆文档频率)
  const dfMap = new Map<string, number>()
  for (const token of new Set(queryTokens))
  {
    let count = 0
    for (const doc of docs)
      if (doc.tfMap.has(token)) count++
    dfMap.set(token, count)
  }

  // 对每个文档计算 BM25 分数
  const scored: RAGResult[] = []
  for (const doc of docs)
  {
    let score = 0
    for (const token of queryTokens)
    {
      const df = dfMap.get(token) || 0
      const tf = doc.tfMap.get(token) || 0
      if (tf === 0) continue

      // IDF 分量（带平滑）
      const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1)
      // TF 分量（BM25 公式）
      const tfNorm = (tf * (K1 + 1)) / (tf + K1 * (1 - B + B * (doc.docLen / avgDl)))
      score += idf * tfNorm
    }

    if (score > 0)
    {
      scored.push({
        sessionTitle: doc.sessionTitle,
        role: doc.role,
        content: doc.content.slice(0, MAX_RESULT_CONTENT),
        score,
      })
    }
  }

  // 按分数降序取 topK
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, topK)
}

/* ========== Composable ========== */

/**
 * Chat RAG Composable
 * 在历史会话中检索与当前查询相关的内容，生成上下文摘要
 */
export function useChatRAG()
{
  /**
   * 检索与 query 相关的历史会话片段
   * @param query 用户输入的查询文本
   * @param sessions 所有历史会话
   * @param options 可选配置
   * @returns RAG 检索结果（空数组表示无相关内容）
   */
  function search(
    query: string,
    sessions: ChatSession[],
    options?: {
      excludeSessionId?: string | null
      topK?: number
      minScore?: number
    },
  ): RAGResult[]
  {
    const { excludeSessionId, topK = 5, minScore = 1.0 } = options || {}
    const docs = buildIndex(sessions, excludeSessionId)
    const results = bm25Search(query, docs, topK)
    return results.filter(r => r.score >= minScore)
  }

  /**
   * 将检索结果格式化为上下文文本（传给后端 context 字段）
   */
  function formatContext(results: RAGResult[]): string
  {
    if (results.length === 0) return ''
    return results
      .map((r, i) => `[${i + 1}] 「${r.sessionTitle}」${r.role === 'user' ? '用户' : '助手'}：${r.content}`)
      .join('\n\n')
  }

  return { search, formatContext }
}
