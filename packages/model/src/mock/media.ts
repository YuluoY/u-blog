import type { IMedia } from '../schema/media'
import { faker } from '@faker-js/faker/locale/zh_CN'
import { getRandomImage } from './utils'
import { createArticle } from './article'
import { createComment } from './comment'
import { createUser } from './user'

/**
 * 创建媒体
 * @returns 媒体
 * @example
 * createMedia()
 */
export const createMedia = (): IMedia =>
{
  const mediaTypes = ['image', 'video', 'audio', 'document', 'other']
  const mimeTypes = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/webm', 'video/ogg'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    document: ['application/pdf', 'application/msword', 'text/plain'],
    other: ['application/octet-stream']
  }

  const type = faker.helpers.arrayElement(mediaTypes)
  const mimeTypeArray = mimeTypes[type as keyof typeof mimeTypes]
  const mimeType = faker.helpers.arrayElement(mimeTypeArray)
  const ext = mimeType.split('/')[1] || 'jpg'

  const isImage = type === 'image'
  const isVideo = type === 'video'

  return {
    id: faker.number.int({ min: 1, max: 1000000 }),
    name: faker.system.fileName() + '.' + ext,
    originalName: faker.system.fileName() + '.' + ext,
    type,
    mineType: mimeType,
    url: getRandomImage(),
    ext,
    size: faker.number.int({ min: 1024, max: 10 * 1024 * 1024 }), // 1KB - 10MB
    hash: faker.string.alphanumeric(32),
    thumbnail: isImage || isVideo ? getRandomImage() : undefined,
    width: isImage || isVideo ? faker.number.int({ min: 100, max: 3840 }) : undefined,
    height: isImage || isVideo ? faker.number.int({ min: 100, max: 2160 }) : undefined,
    duration: isVideo || type === 'audio' ? faker.number.int({ min: 10, max: 3600 }) : undefined,
    articleId: faker.helpers.arrayElement([faker.number.int({ min: 1, max: 1000000 }), undefined]),
    article: faker.helpers.arrayElement([createArticle(), undefined]),
    commentId: faker.helpers.arrayElement([faker.number.int({ min: 1, max: 1000000 }), undefined]),
    comment: faker.helpers.arrayElement([createComment(), undefined]),
    userId: faker.helpers.arrayElement([faker.number.int({ min: 1, max: 1000000 }), undefined]),
    user: faker.helpers.arrayElement([createUser(), undefined]),
    createdAt: faker.date.between({
      from: '2020-01-01',
      to: new Date()
    }),
    updatedAt: faker.date.between({
      from: '2020-01-01',
      to: new Date()
    })
  }
}

