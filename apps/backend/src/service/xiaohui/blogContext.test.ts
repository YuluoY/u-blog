import assert from 'node:assert/strict'
import { test } from 'node:test'
import { detectBlogIntent } from './blogContext'

test('detectBlogIntent 能识别截图中的“最近发布了什么新文章”问法', () => {
  assert.deepEqual(detectBlogIntent('最近发布了什么新文章?'), { type: 'latest_articles' })
  assert.deepEqual(detectBlogIntent('最近更新了哪些文章'), { type: 'latest_articles' })
  assert.deepEqual(detectBlogIntent('最近发了什么文章'), { type: 'latest_articles' })
})

test('detectBlogIntent 不会把热门文章问法误判成最新文章', () => {
  assert.deepEqual(detectBlogIntent('最近最热的文章有哪些'), { type: 'hot_articles' })
  assert.deepEqual(detectBlogIntent('浏览最多的文章有哪些'), { type: 'hot_articles' })
})

