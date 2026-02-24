/**
 * CSDN 博客迁移脚本
 * 抓取全部 43 篇文章 → HTML 转 Markdown（turndown）→ 写入生产数据库
 *
 * 运行方式（服务器上）：
 *   source /root/.nvm/nvm.sh && node /tmp/migrate-csdn.mjs
 *
 * 依赖（服务器上预装）：
 *   npm install --prefix /tmp/csdn-deps turndown turndown-plugin-gfm
 */

import { createRequire } from 'module'
import https from 'https'

// ── 从 /tmp/csdn-deps 加载依赖 ────────────────────────────────────
const DEPS_PATH = process.env.DEPS_PATH || '/tmp/csdn-deps/package.json'
const PG_MODULE = process.env.PG_PATH || '/var/www/u-blog/source/apps/backend/node_modules/pg'

const reqDeps = createRequire(DEPS_PATH)
const TurndownService = reqDeps('turndown')
const { gfm } = reqDeps('turndown-plugin-gfm')

// pg 加载：先尝试 /tmp/csdn-deps，失败则加载 server 路径
let Client
try {
  Client = reqDeps('pg').Client
} catch {
  Client = createRequire(import.meta.url)(PG_MODULE).Client
}

// ── 初始化 Turndown（处理 CSDN prism 代码块）──────────────────────
function createTurndown() {
  const td = new TurndownService({ codeBlockStyle: 'fenced', headingStyle: 'atx' })
  td.use(gfm)

  // CSDN 代码块内有大量 <span class="token ..."> 高亮标签，用 textContent 剥离
  td.addRule('csdnCodeBlock', {
    filter: node => node.nodeName === 'PRE',
    replacement(content, node) {
      const code = node.firstChild && node.firstChild.nodeName === 'CODE'
        ? node.firstChild : node
      const cls = (code.getAttribute ? code.getAttribute('class') : code.className) || ''
      const lang = cls.replace(/.*language-/, '').replace(/\s.*/, '').trim()
      const text = (code.textContent || '').replace(/\n$/, '')
      return '\n\n```' + lang + '\n' + text + '\n```\n\n'
    }
  })

  // 去除 CSDN 图标、空链接等无用标签
  td.addRule('removeUseless', {
    filter: ['svg', 'button'],
    replacement: () => ''
  })

  return td
}

// ── 数据库配置（服务器本地连接）──────────────────────────────────
const DB_CONFIG = {
  host: '127.0.0.1',
  port: 5432,
  user: 'ublog',
  password: 'Ublog2024!',
  database: 'ublog',
}
const OWNER_ID = 1

// ── CSDN 全部文章列表（共 43 篇）──────────────────────────────────
const CSDN_ARTICLES = [
  { id: 151833817, title: 'Vue 原理三大子系统：编译时、响应式与运行时',                date: '2025-09-18', tags: ['Vue3', '前端'] },
  { id: 151757197, title: 'Docker 零基础到实战：一文吃透镜像、容器与 Compose',         date: '2025-09-16', tags: ['Docker', '运维'] },
  { id: 151704496, title: 'Nginx 从入门到进阶：反向代理、负载均衡与高性能实战指南',    date: '2025-09-15', tags: ['Nginx', '运维'] },
  { id: 151372173, title: 'SQL 触发器从入门到进阶：原理、时机、实战与避坑指南',        date: '2025-09-09', tags: ['SQL', '数据库'] },
  { id: 151311265, title: 'SQL 函数从入门到精通：原理、类型、窗口函数与实战指南',      date: '2025-09-08', tags: ['SQL', '数据库'] },
  { id: 151310708, title: '从0到1搞懂 SQL 存储过程：原理、实战与避坑指南',            date: '2025-09-08', tags: ['SQL', '数据库'] },
  { id: 151296567, title: 'Promise 实现原理：手写一个符合 Promises/A+ 规范的 Promise',date: '2025-09-07', tags: ['JavaScript', '前端'] },
  { id: 151219342, title: 'JavaScript this 终极解密：从懵逼到精通',                   date: '2025-09-05', tags: ['JavaScript', '前端'] },
  { id: 151142910, title: 'JavaScript 字符串分隔方法深度解析：split、Array.from、扩展运算符', date: '2025-09-03', tags: ['JavaScript', '前端'] },
  { id: 144442945, title: 'KMP 算法：一个让你少走弯路的字符串匹配算法',               date: '2024-12-13', tags: ['算法', 'JavaScript'] },
  { id: 144204533, title: '算法之反转数组',                                            date: '2024-12-03', tags: ['算法', 'JavaScript'] },
  { id: 139134978, title: 'Webpack5 解决静态资源重复打包问题',                         date: '2024-05-23', tags: ['前端工程化'] },
  { id: 137433022, title: 'SQL 第七章（ORDER BY, LIMIT, OFFSET 排序与限制）',          date: '2024-04-06', tags: ['SQL', '数据库'] },
  { id: 137432920, title: 'SQL 第六章（REGEXP 正则）',                                  date: '2024-04-06', tags: ['SQL', '数据库'] },
  { id: 137250646, title: 'SQL 第五章（IN, BETWEEN, LIKE 运算符）',                    date: '2024-04-01', tags: ['SQL', '数据库'] },
  { id: 137213273, title: '发布自己的 VsCode 插件（手把手教学）',                      date: '2024-04-01', tags: ['VsCode', '工具'] },
  { id: 137161914, title: 'SQL 第四章（AND, OR, NOT 逻辑运算符）',                     date: '2024-03-30', tags: ['SQL', '数据库'] },
  { id: 137161839, title: 'SQL 第三章（WHERE 子句查询）',                               date: '2024-03-30', tags: ['SQL', '数据库'] },
  { id: 137161786, title: 'SQL 第二章（基础查询）',                                    date: '2024-03-30', tags: ['SQL', '数据库'] },
  { id: 137161760, title: 'SQL 第一章（准备工作）',                                    date: '2024-03-30', tags: ['SQL', '数据库'] },
  { id: 136979561, title: 'React 之 setState 的前世今生',                               date: '2024-03-24', tags: ['React', '前端'] },
  { id: 136694769, title: '关于前端项目组织与模块动态导出',                            date: '2024-03-13', tags: ['前端工程化', 'JavaScript'] },
  { id: 136694723, title: '解决 create-react-app 项目下使用 require.context 问题',     date: '2024-03-13', tags: ['React', '前端工程化'] },
  { id: 135119523, title: 'Sass 之 BEM 前端规范架构',                                  date: '2023-12-20', tags: ['Sass', 'CSS', '前端工程化'] },
  { id: 135028375, title: 'NestJS 构建下一代 Node.js 应用',                            date: '2023-12-16', tags: ['NestJS', 'Node.js', '后端'] },
  { id: 135007451, title: 'NestJS 文件上传之本地存储与腾讯 COS',                       date: '2023-12-15', tags: ['NestJS', 'Node.js', '后端'] },
  { id: 134657154, title: '基于 Vite 构建企业级前端项目',                              date: '2023-11-27', tags: ['Vite', '前端工程化'] },
  { id: 134657045, title: 'MongoDB 副本集配置：构建稳健的数据复制体系',                date: '2023-11-27', tags: ['MongoDB', '数据库'] },
  { id: 121513000, title: '使用原生 Nodejs 搭建基本服务框架',                          date: '2021-11-24', tags: ['Node.js', '后端'] },
  { id: 121490126, title: 'Vue3 之 watch 的最简用法',                                  date: '2021-11-23', tags: ['Vue3'] },
  { id: 121373857, title: 'Nodejs 之 cors 跨域',                                       date: '2021-11-17', tags: ['Node.js', '后端'] },
  { id: 121372707, title: 'Nodejs 之 jsonp 跨域',                                      date: '2021-11-17', tags: ['Node.js', '后端'] },
  { id: 121321205, title: '使用 Nodejs 搭建一个简易的留言簿（完结）',                  date: '2021-11-14', tags: ['Node.js', '后端'] },
  { id: 121045421, title: '浅谈 Vue 中的 bus 事件总线注意事项',                        date: '2021-10-30', tags: ['Vue3'] },
  { id: 120926979, title: 'Vue 之 vue-router 路由、多级路由、路由传参',                date: '2021-10-23', tags: ['Vue3'] },
  { id: 120810970, title: '使用 Vue 和 axios 发送 ajax 请求及 vue-cli 代理解决跨域',  date: '2021-10-17', tags: ['Vue3', '前端'] },
  { id: 120787875, title: 'Nodejs 服务器热更新',                                       date: '2021-10-15', tags: ['Node.js', '后端'] },
  { id: 120773938, title: '使用 Express 框架创建服务器实现跨域及 AJAX 请求',          date: '2021-10-15', tags: ['Node.js', '后端'] },
  { id: 120605232, title: 'Vue 无法加载文件：在此系统上禁止运行脚本',                  date: '2021-10-04', tags: ['Vue3', '工具'] },
  { id: 116228225, title: '使用 Python Pyecharts 的 map 地图 + JS 省市自动化链接跳转',date: '2021-04-28', tags: ['Python'] },
  { id: 115716804, title: 'JSP 连接 SQL Server 数据库',                                date: '2021-04-15', tags: ['数据库'] },
  { id: 110954892, title: 'Python 手动安装模块',                                       date: '2020-12-10', tags: ['Python'] },
  { id: 110954284, title: '关于 Python 查看 pip 所支持的所有格式',                     date: '2020-12-10', tags: ['Python'] },
]

// ── 需新增的标签（不在原有26个中的）─────────────────────────────
const NEW_TAGS = [
  { name: 'Docker',   color: '#2496ED' },
  { name: '算法',    color: '#FF6B35' },
  { name: 'MongoDB',  color: '#47A248' },
  { name: 'Python',   color: '#3776AB' },
]

// ── 全局 turndown 实例 ───────────────────────────────────────────
const td = createTurndown()

/** HTML → Markdown（turndown，处理 CSDN prism 代码块）*/
function htmlToMarkdown(html) {
  if (!html || html.trim().length < 10) return ''
  // 预处理：去除 CSDN 的目录、脚本、图标按钮、广告区
  html = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')             // 脚本
    .replace(/<div[^>]+id="toc[^"]*"[\s\S]*?<\/div>/gi, '') // 目录(id)
    .replace(/<div[^>]+class="[^"]*toc[^"]*"[\s\S]*?<\/div>/gi, '') // 目录(class)
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')                   // SVG 图标
  const md = td.turndown(html).replace(/\n{4,}/g, '\n\n\n').trim()
  // 去除末尾残留的 $() jQuery 片段
  return md.replace(/\$\(function\(\)[\s\S]*$/, '').trim()
}

// ── HTTP 请求封装（含重试）─────────────────────────────────────────
function fetchPage(url, retries = 3) {
  return new Promise((resolve, reject) => {
    const tryFetch = (attempt) => {
      const req = https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }
      }, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return fetchPage(res.headers.location, retries).then(resolve).catch(reject)
        }
        let data = ''
        res.on('data', c => data += c)
        res.on('end', () => resolve(data))
      })
      req.on('error', err => {
        if (attempt < retries) {
          console.log(`    重试 ${attempt + 1}/${retries}...`)
          setTimeout(() => tryFetch(attempt + 1), 2000 * attempt)
        } else {
          reject(err)
        }
      })
      req.setTimeout(20000, () => {
        req.destroy()
        if (attempt < retries) {
          setTimeout(() => tryFetch(attempt + 1), 2000 * attempt)
        } else {
          reject(new Error('timeout'))
        }
      })
    }
    tryFetch(1)
  })
}

/** 从 CSDN 文章页面提取 content_views 区域并转换为 Markdown */
async function fetchCsdnArticle(articleId) {
  const url = `https://blog.csdn.net/weixin_42390185/article/details/${articleId}`
  const html = await fetchPage(url)

  // 找到 content_views 的起始位置
  const startIdx = html.indexOf('id="content_views"')
  if (startIdx === -1) {
    console.log(`    [debug] content_views not found! HTML len=${html.length}, first 200: ${html.substring(0, 200).replace(/\n/g, ' ')}`)
    return null
  }

  // 找到内容的真实结束位置（付费墙、推荐区或文章信息区）
  const endMarkers = [
    'id="vip-limited-time-offer-box-new"',
    'id="vip-limited-time-offer-box"',
    'class="vip-limited-time-offer"',
    'id="recommend_next"',
    'id="article-outline"',
    'class="article-info-box"',
    'class="recommend-box"',
  ]

  let endIdx = html.length
  for (const marker of endMarkers) {
    const idx = html.indexOf(marker, startIdx)
    if (idx > 0 && idx < endIdx) endIdx = idx
  }

  // 提取内容区域 HTML（跳过 content_views 标签本身，找到 > 后的内容）
  const tagEnd = html.indexOf('>', startIdx) + 1
  const contentHtml = html.substring(tagEnd, endIdx)

  if (!contentHtml || contentHtml.trim().length < 50) {
    // 备用：通过 article_content 查找
    const m2 = html.match(/id="article_content"[^>]*>([\s\S]{100,}?)<div[^>]+class="[^"]*article-info/)
    if (m2) return htmlToMarkdown(m2[1])
    console.log(`    [debug] contentHtml.length=${contentHtml ? contentHtml.length : 'null'}`)
    return null
  }

  const md = htmlToMarkdown(contentHtml)
  if (!md || md.length < 50) {
    console.log(`    [debug] htmlToMarkdown returned short/empty: ${md ? md.length : 'null'} chars, contentHtml=${contentHtml.length}`)
  }
  return md
}

// ── 延迟函数 ───────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// ── 主流程 ─────────────────────────────────────────────────────────
async function main() {
  console.log('🔌 连接数据库...')
  const client = new Client(DB_CONFIG)
  await client.connect()
  console.log('✅ 数据库连接成功\n')

  await client.query('BEGIN')

  try {
    // ── 1. 查询现有分类和标签 ─────────────────────────────────────
    const catRes = await client.query('SELECT id, name FROM category')
    const tagRes = await client.query('SELECT id, name FROM tag')

    const categoryMap = Object.fromEntries(catRes.rows.map(r => [r.name, r.id]))
    const tagMap = Object.fromEntries(tagRes.rows.map(r => [r.name, r.id]))

    // ── 2. 创建新标签 ─────────────────────────────────────────────
    console.log('🏷️  检查并创建新标签...')
    for (const { name, color } of NEW_TAGS) {
      if (!tagMap[name]) {
        const r = await client.query(
          `INSERT INTO tag (name, color, "userId", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
          [name, color, OWNER_ID]
        )
        tagMap[name] = r.rows[0].id
        console.log(`  ✅ 新标签「${name}」id=${r.rows[0].id}`)
      }
    }
    console.log()

    // ── 3. 抓取并插入文章 ─────────────────────────────────────────
    console.log(`📝 开始抓取并插入 ${CSDN_ARTICLES.length} 篇 CSDN 文章...`)
    let ok = 0
    let fail = 0

    for (const article of CSDN_ARTICLES) {
      process.stdout.write(`  ⏳ [${article.id}] ${article.title.substring(0, 30)}...`)

      let content = null
      try {
        content = await fetchCsdnArticle(article.id)
      } catch (err) {
        console.log(` ❌ 抓取失败: ${err.message}`)
        fail++
        await sleep(1000)
        continue
      }

      if (!content || content.trim().length < 50) {
        console.log(` ⚠️  内容为空或过短 (len=${content ? content.length : 'null'})，跳过`)
        fail++
        await sleep(500)
        continue
      }

      try {
        // 幂等检查：如果已存在同标题文章则跳过
        const exists = await client.query(
          `SELECT id FROM article WHERE title = $1 AND "userId" = $2 LIMIT 1`,
          [article.title, OWNER_ID]
        )
        if (exists.rows.length > 0) {
          console.log(` ⏭️  已存在，跳过 (id=${exists.rows[0].id})`)
          ok++
          await sleep(100)
          continue
        }

        const catId = categoryMap['技术'] || 2  // 全部 CSDN 文章归入技术分类
        const publishedAt = new Date(article.date)

        // 插入文章
        const res = await client.query(
          `INSERT INTO article
             (title, content, "desc", status, "isPrivate", "isTop",
              "userId", "categoryId", "commentCount", "likeCount",
              "viewCount", "publishedAt", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, 'published', false, false, $4, $5, 0, 0, 0, $6, NOW(), NOW())
           RETURNING id`,
          [article.title, content, article.title, OWNER_ID, catId, publishedAt]
        )
        const articleId = res.rows[0].id

        // 关联标签
        const tagIds = []
        for (const tagName of article.tags) {
          if (tagMap[tagName]) {
            await client.query(
              `INSERT INTO article_tag ("articleId", "tagId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [articleId, tagMap[tagName]]
            )
            tagIds.push(tagMap[tagName])
          }
        }

        console.log(` ✅ id=${articleId}, tags=[${tagIds.join(',')}], content=${content.length}chars`)
        ok++
      } catch (err) {
        console.log(` ❌ 写库失败: ${err.message}`)
        fail++
      }

      // 礼貌性抓取间隔，避免被 CSDN 限流
      await sleep(800)
    }

    await client.query('COMMIT')

    console.log('\n' + '─'.repeat(45))
    console.log(`✅ 成功: ${ok} 篇`)
    if (fail > 0) console.log(`❌ 失败: ${fail} 篇`)
    console.log('🎉 CSDN 迁移完成！')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('💥 事务回滚:', err.message)
    throw err
  } finally {
    await client.end()
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
