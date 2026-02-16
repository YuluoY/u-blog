/**
 * 留言板页面 DOM 调试脚本：操作并检查 [data-comment-id]、回复 @ 按钮、一级缩进等
 * 运行前确保 dev 已启动，然后: node scripts/debug-message-dom.mjs
 * 需要先安装: pnpm add -D puppeteer -w
 */
const dynamicImport = (s) => import(s).catch(() => null);

async function main() {
  const puppeteer = await dynamicImport('puppeteer');
  if (!puppeteer) {
    console.log('请先安装 puppeteer: pnpm add -D puppeteer -w');
    process.exit(1);
  }

  const executablePath =
    process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : undefined;
  const browser = await puppeteer.default.launch({
    headless: true,
    ...(executablePath && { executablePath }),
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    await page.goto('http://localhost:5173/message', { waitUntil: 'networkidle0', timeout: 10000 });
  } catch (e) {
    console.error('无法打开 http://localhost:5173/message，请先执行 pnpm dev');
    await browser.close();
    process.exit(1);
  }

  const result = await page.evaluate(() => {
    const comments = document.querySelectorAll('[data-comment-id]');
    const replyToButtons = document.querySelectorAll('.u-comment-item__reply-to');
    const childrenContainers = document.querySelectorAll('.u-comment-item__children');
    const flatContainers = document.querySelectorAll('.u-comment-item__children--flat');

    const getStyle = (el, prop) => (el ? getComputedStyle(el)[prop] : null);
    const firstChildren = childrenContainers[0];
    const firstFlat = flatContainers[0];

    return {
      commentIds: Array.from(comments).map((el) => el.getAttribute('data-comment-id')),
      replyToCount: replyToButtons.length,
      replyToTexts: Array.from(replyToButtons).slice(0, 5).map((b) => b.textContent?.trim() ?? ''),
      childrenCount: childrenContainers.length,
      flatCount: flatContainers.length,
      firstChildrenPaddingLeft: getStyle(firstChildren, 'paddingLeft'),
      firstFlatPaddingLeft: getStyle(firstFlat, 'paddingLeft'),
      scrollContainer: document.querySelector('.layout-base__main') ? 'found' : 'not-found',
    };
  });

  console.log('--- 留言板 DOM 检查 ---');
  console.log('data-comment-id 数量:', result.commentIds.length, 'ids:', result.commentIds.join(', '));
  console.log('「回复 @xxx」按钮数量:', result.replyToCount, '示例:', result.replyToTexts);
  console.log('.u-comment-item__children 数量:', result.childrenCount);
  console.log('.u-comment-item__children--flat 数量（嵌套不累加缩进）:', result.flatCount);
  console.log('第一层 children paddingLeft:', result.firstChildrenPaddingLeft);
  console.log('第一层 flat children paddingLeft:', result.firstFlatPaddingLeft);
  console.log('滚动容器 .layout-base__main:', result.scrollContainer);

  const scrollYBefore = await page.evaluate(() => window.scrollY ?? document.documentElement.scrollTop);
  const firstReplyTo = await page.$('.u-comment-item__reply-to');
  if (firstReplyTo) {
    await firstReplyTo.click();
    await new Promise((r) => setTimeout(r, 800));
    const scrollYAfter = await page.evaluate(() => window.scrollY ?? document.documentElement.scrollTop);
    const mainScroll = await page.evaluate(() => {
      const main = document.querySelector('.layout-base__main');
      return main ? { scrollTop: main.scrollTop, scrollHeight: main.scrollHeight } : null;
    });
    console.log('--- 点击「回复 @某人」后 ---');
    console.log('window scrollY 变化:', scrollYBefore, '->', scrollYAfter);
    console.log('.layout-base__main scrollTop/scrollHeight:', mainScroll);
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
