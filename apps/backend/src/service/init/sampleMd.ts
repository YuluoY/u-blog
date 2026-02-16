/**
 * 使用 faker 填充、多种 MD 格式、每篇至少 minChars 字符的文章生成。
 * 用于种子与批量更新，结构按索引轮换，内容随机但可复现（faker.seed）。
 */
import { faker } from '@faker-js/faker/locale/zh_CN'

const MIN_CHARS = 3000

/** 中文短语池，用于生成段落与列表项 */
const ZH = [
  '在实际开发中', '需要注意的是', '简单来说', '举个例子', '从另一个角度', '总的来说', '首先我们要', '接下来', '最后', '因此', '然而', '另外', '同时', '一方面', '另一方面',
  '技术选型', '性能优化', '代码质量', '可维护性', '团队协作', '需求分析', '架构设计', '接口定义', '数据流转', '状态管理', '错误处理', '日志监控', '部署发布', '测试覆盖',
  '前端框架', '后端服务', '数据库设计', '缓存策略', '安全规范', '用户体验', '响应式布局', '无障碍访问', '浏览器兼容', '打包构建', '持续集成', '代码审查', '文档完善',
  '变量命名', '函数拆分', '模块划分', '依赖管理', '版本控制', '分支策略', '问题排查', '性能分析', '内存泄漏', '网络请求', '异步处理', '并发控制', '事务一致性'
]

const CODE_SNIPPETS = [
  { lang: 'javascript', code: 'function handleClick() {\n  const count = ref(0)\n  return { count }\n}' },
  { lang: 'typescript', code: 'interface User {\n  id: number\n  name: string\n}\nconst u: User = { id: 1, name: "test" }' },
  { lang: 'python', code: 'def main():\n    result = sum(range(10))\n    return result' },
  { lang: 'sql', code: 'SELECT id, name FROM users\nWHERE status = 1\nORDER BY created_at DESC;' },
  { lang: 'bash', code: '#!/bin/bash\nnpm run build\nnpm run deploy' }
]

type SectionType = 'h1' | 'h2' | 'h3' | 'p' | 'ul' | 'ol' | 'code' | 'quote' | 'table' | 'link' | 'image' | 'hr'

/** 多种结构模板（section 类型顺序不同），保证 MD 格式各异 */
const STRUCTURES: SectionType[][] = [
  ['h1', 'p', 'h2', 'p', 'ul', 'h3', 'code', 'p', 'quote', 'h2', 'table', 'p', 'hr'],
  ['h1', 'h2', 'p', 'ol', 'p', 'h3', 'quote', 'code', 'p', 'link', 'h2', 'ul', 'p', 'hr'],
  ['h1', 'p', 'h2', 'code', 'h3', 'p', 'table', 'p', 'ul', 'quote', 'p', 'image', 'hr'],
  ['h1', 'h2', 'h3', 'p', 'ol', 'p', 'code', 'quote', 'h2', 'ul', 'p', 'table', 'hr'],
  ['h1', 'p', 'quote', 'h2', 'ul', 'p', 'h3', 'code', 'p', 'table', 'link', 'p', 'hr'],
  ['h1', 'h2', 'p', 'table', 'h3', 'code', 'p', 'ol', 'quote', 'p', 'ul', 'hr'],
  ['h1', 'p', 'h2', 'ul', 'p', 'code', 'h3', 'quote', 'table', 'p', 'image', 'hr'],
  ['h1', 'h2', 'p', 'ol', 'h3', 'p', 'code', 'ul', 'quote', 'p', 'table', 'hr'],
  ['h1', 'p', 'code', 'h2', 'p', 'table', 'h3', 'ul', 'quote', 'p', 'ol', 'link', 'hr'],
  ['h1', 'h2', 'p', 'quote', 'h3', 'ul', 'p', 'code', 'table', 'p', 'hr']
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(faker.number.float() * arr.length)]
}

function paragraph(minLen: number, maxLen: number): string {
  let s = ''
  const target = faker.number.int({ min: minLen, max: maxLen })
  while (s.length < target) {
    s += pick(ZH)
    if (faker.number.float() > 0.3) s += '，'
    else s += '。'
  }
  return s.slice(0, target)
}

function section(type: SectionType): string {
  switch (type) {
    case 'h1':
      return `# ${pick(ZH)}${pick(ZH)}${pick(ZH)}\n\n`
    case 'h2':
      return `## ${pick(ZH)}${pick(ZH)}\n\n`
    case 'h3':
      return `### ${pick(ZH)}\n\n`
    case 'p': {
      const text = paragraph(120, 280)
      return `${text}\n\n`
    }
    case 'ul': {
      const n = faker.number.int({ min: 4, max: 7 })
      const items = Array.from({ length: n }, () => `- ${pick(ZH)}${pick(ZH)}${pick(ZH)}`).join('\n')
      return `${items}\n\n`
    }
    case 'ol': {
      const n = faker.number.int({ min: 3, max: 6 })
      const items = Array.from({ length: n }, (_, i) => `${i + 1}. ${pick(ZH)}${pick(ZH)}`).join('\n')
      return `${items}\n\n`
    }
    case 'code': {
      const s = pick(CODE_SNIPPETS)
      return `\`\`\`${s.lang}\n${s.code}\n\`\`\`\n\n`
    }
    case 'quote':
      return `> ${pick(ZH)}${pick(ZH)}${pick(ZH)}${pick(ZH)}。\n\n`
    case 'table': {
      const cols = faker.number.int({ min: 3, max: 4 })
      const rows = faker.number.int({ min: 3, max: 5 })
      const head = '| ' + Array.from({ length: cols }, () => pick(ZH)).join(' | ') + ' |\n'
      const sep = '|' + Array.from({ length: cols }, () => '---').join('|') + '|\n'
      const body = Array.from({ length: rows }, () => '| ' + Array.from({ length: cols }, () => pick(ZH)).join(' | ') + ' |').join('\n') + '\n\n'
      return head + sep + body
    }
    case 'link':
      return `[${pick(ZH)}${pick(ZH)}](${faker.internet.url()})\n\n`
    case 'image':
      return `![${pick(ZH)}](${faker.image.url()})\n\n`
    case 'hr':
      return '---\n\n'
    default:
      return ''
  }
}

/**
 * 按索引生成一篇 MD 文章：结构轮换、内容 faker 填充，长度至少 minChars。
 */
export function generateArticleMd(index: number, minChars: number = MIN_CHARS): string {
  faker.seed(index)
  const structure = STRUCTURES[index % STRUCTURES.length]
  let out = ''
  let pass = 0
  while (out.length < minChars) {
    for (const t of structure) {
      out += section(t)
      if (out.length >= minChars) break
    }
    pass++
    if (pass > 3) break // 避免死循环
  }
  return out.slice(0, Math.max(minChars, out.length))
}

/** 按索引取一篇（用于兼容：返回 3000+ 字的 faker 生成内容） */
export function getSampleMdByIndex(index: number): string {
  return generateArticleMd(index, MIN_CHARS)
}

export const SAMPLE_ARTICLE_MD_TEMPLATE_COUNT = STRUCTURES.length
export const SAMPLE_ARTICLE_MD = generateArticleMd(0, MIN_CHARS)
