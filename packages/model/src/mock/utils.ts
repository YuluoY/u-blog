import { faker } from '@faker-js/faker/locale/zh_CN'

/**
 * 根据标题级别获取内容类型
 * @param currentLevel 当前标题级别
 * @param maxLevel 最大标题级别
 * @returns 内容类型（1-6）
 */
const getContentTypeByHeadingLevel = (currentLevel: number, maxLevel: number): number =>
{
  // 如果当前级别已经达到最大级别，减少生成新标题的概率
  if (currentLevel >= maxLevel)
  {
    return faker.helpers.weightedArrayElement([
      { weight: 10, value: 2 }, // 段落
      { weight: 5, value: 3 },  // 列表
      { weight: 3, value: 4 }, // 代码块
      { weight: 2, value: 5 }, // 引用
      { weight: 2, value: 6 }   // 链接
    ])
  }

  // 正常情况下的权重分布
  return faker.helpers.weightedArrayElement([
    { weight: 3, value: 1 },   // 副标题
    { weight: 8, value: 2 },   // 段落
    { weight: 4, value: 3 },   // 列表
    { weight: 2, value: 4 },   // 代码块
    { weight: 2, value: 5 },   // 引用
    { weight: 1, value: 6 }    // 链接
  ])
}

/**
 * 复制对象
 * @param target 对象
 * @param param1 { min: number, max: number }
 * @returns 对象数组
 * @example
 * toCopy(createUser(), { min: 1, max: 5 })
 */
export const toCopy = <T = any>(target: T | (() => T), { min = 1, max = 5 } = {}): T[] => Array.from({ length: faker.number.int({ min, max }) }).map(() => {
  return typeof target === 'function' ? (target as () => T)() : target
})

/**
 * 获取随机图片
 * @returns 图片
 * @example
 * getRandomImage()
 */
export const getRandomImage = (): string => {
  // 使用faker生成随机图片
  return faker.image.url()
}

/**
 * 生成随机 Markdown 文档
 * @param targetLength 目标文本长度（字符数）
 * @param maxHeadingLevel 最大标题级别（1-6，默认为3）
 * @returns Markdown 格式的文档字符串
 * @example
 * generateRandomMarkdown(1000, 2) // 最多使用 ## 级别的标题
 */
export const generateRandomMarkdown = (targetLength: number, maxHeadingLevel: number = 3): string =>
{
  const sections = []
  let currentLength = 0
  let currentHeadingLevel = 1 // 当前标题级别

  // 生成标题
  const title = faker.lorem.sentence(faker.number.int({ min: 3, max: 8 }))
  sections.push(`# ${title}`)
  currentLength += title.length + 3

  // 生成副标题和内容段落
  while (currentLength < targetLength)
  {
    const remainingLength = targetLength - currentLength

    // 根据当前标题级别调整内容类型权重
    const contentType = getContentTypeByHeadingLevel(currentHeadingLevel, maxHeadingLevel)

    switch (contentType)
    {
    case 1: // 副标题
    {
      const subtitle = faker.lorem.sentence(faker.number.int({ min: 2, max: 6 }))
      // 选择标题级别：要么是当前级别+1，要么是随机级别（但不超过最大级别）
      const nextLevel = Math.min(currentHeadingLevel + 1, maxHeadingLevel)
      const headingLevel = faker.number.int({ min: 2, max: nextLevel })
      const headingMark = '#'.repeat(headingLevel)
      sections.push(`${headingMark} ${subtitle}`)
      currentLength += subtitle.length + headingMark.length + 2
      currentHeadingLevel = headingLevel
      break
    }

    case 2: // 段落
    {
      const paragraphLength = Math.min(remainingLength - 10, faker.number.int({ min: 50, max: 200 }))
      const paragraph = faker.lorem.paragraph(Math.ceil(paragraphLength / 50))
      sections.push(`\n${paragraph}\n`)
      currentLength += paragraph.length + 2
      break
    }

    case 3: // 列表
    {
      const listItems = faker.number.int({ min: 3, max: 8 })
      const listContent = Array.from({ length: listItems }, () =>
      {
        const item = faker.lorem.sentence(faker.number.int({ min: 5, max: 20 }))
        return `- ${item}`
      }).join('\n')
      sections.push(`\n${listContent}\n`)
      currentLength += listContent.length + 2
      break
    }

    case 4: // 代码块
    {
      const codeLanguage = faker.helpers.arrayElement(['javascript', 'typescript', 'python', 'css', 'html', 'json'])
      const codeContent = faker.lorem.sentence(faker.number.int({ min: 10, max: 50 }))
      const codeBlock = `\`\`\`${codeLanguage}\n${codeContent}\n\`\`\``
      sections.push(`\n${codeBlock}\n`)
      currentLength += codeBlock.length + 2
      break
    }

    case 5: // 引用
    {
      const quote = faker.lorem.sentence(faker.number.int({ min: 10, max: 80 }))
      sections.push(`\n> ${quote}\n`)
      currentLength += quote.length + 4
      break
    }

    case 6: // 链接
    {
      const linkText = faker.lorem.words(faker.number.int({ min: 2, max: 5 }))
      const linkUrl = faker.internet.url()
      const link = `[${linkText}](${linkUrl})`
      sections.push(`\n${link}\n`)
      currentLength += link.length + 2
      break
    }
    }

    // 如果接近目标长度，添加最后一个段落
    if (currentLength >= targetLength * 0.9)
    {
      const finalParagraph = faker.lorem.paragraph(Math.ceil((targetLength - currentLength) / 50))
      sections.push(`\n${finalParagraph}`)
      currentLength += finalParagraph.length + 1
      break
    }
  }

  return sections.join('')
}

