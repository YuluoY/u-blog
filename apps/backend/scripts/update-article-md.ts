/**
 * 1. 将文章数量调整为 50 篇（多删少补）
 * 2. 每篇内容为 faker 填充、多种 MD 格式、至少 3000 字
 * 使用方式（在 apps/backend 目录下）：pnpm run update-article-md
 */
import 'dotenv/config'
import { DataSource, In } from 'typeorm'
import { faker } from '@faker-js/faker/locale/zh_CN'
import appCfg from '../src/app/index.js'
import { Article } from '../src/module/schema/Article.js'
import { Users } from '../src/module/schema/Users.js'
import { getSampleMdByIndex } from '../src/service/init/sampleMd.js'
import { CArticleStatus } from '@u-blog/model'

const MAX_ARTICLES = 50

async function main() {
  const ds = new DataSource(appCfg.database as any)
  await ds.initialize()
  const articleRepo = ds.getRepository(Article)
  const userRepo = ds.getRepository(Users)

  const all = await articleRepo.find({ order: { id: 'ASC' }, select: ['id'] })
  const total = all.length

  if (total > MAX_ARTICLES) {
    const toDelete = all.slice(MAX_ARTICLES).map((a) => a.id)
    await articleRepo.delete({ id: In(toDelete) })
    console.log(`✅ 已删除 ${total - MAX_ARTICLES} 篇，保留前 ${MAX_ARTICLES} 篇`)
  }

  const kept = await articleRepo.find({ order: { id: 'ASC' } })
  for (let i = 0; i < kept.length; i++) {
    await articleRepo.update(kept[i].id, { content: getSampleMdByIndex(i) })
  }
  console.log(`✅ 已更新 ${kept.length} 篇文章内容（faker 填充、多种 MD、≥3000 字）`)

  if (kept.length < MAX_ARTICLES) {
    const users = await userRepo.find({ take: 1 })
    if (users.length === 0) {
      console.log('⚠️ 无用户，跳过补齐文章')
    } else {
      const userId = users[0].id
      const toCreate = MAX_ARTICLES - kept.length
      const titles = ['技术实践', '开发笔记', '架构思考', '性能优化', '工程化总结', '踩坑记录', '学习心得', '方案对比', '工具推荐', '规范约定']
      for (let i = 0; i < toCreate; i++) {
        const idx = kept.length + i
        const article = articleRepo.create({
          userId,
          categoryId: null,
          title: `${titles[idx % titles.length]} ${faker.string.alphanumeric(4)}`,
          content: getSampleMdByIndex(idx),
          desc: faker.helpers.arrayElement(titles) + '。',
          status: CArticleStatus.PUBLISHED,
          isPrivate: false,
          isTop: false,
          commentCount: 0,
          likeCount: 0,
          viewCount: 0,
          publishedAt: faker.date.between({ from: '2024-01-01', to: new Date() })
        })
        await articleRepo.save(article)
      }
      console.log(`✅ 已补齐 ${toCreate} 篇，当前共 ${MAX_ARTICLES} 篇`)
    }
  }

  await ds.destroy()
}

main().catch((e) => {
  console.error('❌ 更新失败:', e)
  process.exit(1)
})
