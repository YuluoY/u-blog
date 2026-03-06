const COMMENT_AUTHOR_HIGHLIGHT_CLASS = 'u-comment-item__author--scroll-target'
const COMMENT_TARGET_GAP = 12
const COMMENT_TARGET_HIGHLIGHT_DURATION = 2200
const COMMENT_SCROLL_SETTLE_FRAMES = 4
const COMMENT_SCROLL_SETTLE_THRESHOLD = 1
const COMMENT_SCROLL_MAX_WAIT = 1200

let activeHighlightTimer: number | null = null
let activeHighlightEl: HTMLElement | null = null
let scrollRequestToken = 0

function getScrollRoot(): HTMLElement | null
{
  return document.querySelector<HTMLElement>('.layout-base__main')
}

function getCommentTarget(commentId: number): HTMLElement | null
{
  return document.querySelector<HTMLElement>(`[data-comment-id="${commentId}"]`)
}

function getAuthorTarget(commentEl: HTMLElement): HTMLElement
{
  return commentEl.querySelector<HTMLElement>('.u-comment-item__author') ?? commentEl
}

function getTopCoverOffset(scrollRoot: HTMLElement): number
{
  const header = document.querySelector<HTMLElement>('.layout-base__header')
  if (!header) return 0

  const headerRect = header.getBoundingClientRect()
  const rootRect = scrollRoot.getBoundingClientRect()
  return Math.max(0, headerRect.bottom - rootRect.top)
}

function clearActiveHighlight()
{
  if (activeHighlightTimer != null)
  {
    window.clearTimeout(activeHighlightTimer)
    activeHighlightTimer = null
  }

  if (activeHighlightEl)
  {
    activeHighlightEl.classList.remove(COMMENT_AUTHOR_HIGHLIGHT_CLASS)
    activeHighlightEl = null
  }
}

function triggerAuthorHighlight(commentEl: HTMLElement)
{
  clearActiveHighlight()

  const authorEl = getAuthorTarget(commentEl)
  authorEl.classList.remove(COMMENT_AUTHOR_HIGHLIGHT_CLASS)
  void authorEl.offsetWidth
  authorEl.classList.add(COMMENT_AUTHOR_HIGHLIGHT_CLASS)

  activeHighlightEl = authorEl
  activeHighlightTimer = window.setTimeout(() =>
  {
    if (activeHighlightEl === authorEl)
    {
      authorEl.classList.remove(COMMENT_AUTHOR_HIGHLIGHT_CLASS)
      activeHighlightEl = null
    }
    activeHighlightTimer = null
  }, COMMENT_TARGET_HIGHLIGHT_DURATION)
}

function prefersReducedMotion(): boolean
{
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function waitForScrollSettled(scrollRoot: HTMLElement, token: number, onSettled: () => void)
{
  const startedAt = performance.now()
  let lastTop = scrollRoot.scrollTop
  let stableFrames = 0

  const step = () =>
  {
    if (token !== scrollRequestToken) return

    const currentTop = scrollRoot.scrollTop
    const delta = Math.abs(currentTop - lastTop)
    const timedOut = performance.now() - startedAt >= COMMENT_SCROLL_MAX_WAIT

    if (delta <= COMMENT_SCROLL_SETTLE_THRESHOLD)
      stableFrames += 1
    else
    {
      stableFrames = 0
      lastTop = currentTop
    }

    if (timedOut || stableFrames >= COMMENT_SCROLL_SETTLE_FRAMES) return onSettled()

    window.requestAnimationFrame(step)
  }

  window.requestAnimationFrame(step)
}

export function scrollToCommentWithOffset(commentId: number): boolean
{
  const target = getCommentTarget(commentId)
  const scrollRoot = getScrollRoot()
  if (!target || !scrollRoot) return false

  const targetRect = target.getBoundingClientRect()
  const rootRect = scrollRoot.getBoundingClientRect()
  const coverOffset = getTopCoverOffset(scrollRoot)
  const nextTop = scrollRoot.scrollTop + (targetRect.top - rootRect.top) - coverOffset - COMMENT_TARGET_GAP
  const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth'

  scrollRequestToken += 1
  const currentToken = scrollRequestToken

  scrollRoot.scrollTo({
    top: Math.max(nextTop, 0),
    behavior,
  })

  if (behavior === 'auto') return triggerAuthorHighlight(target), true

  waitForScrollSettled(scrollRoot, currentToken, () =>
  {
    const latestTarget = getCommentTarget(commentId)
    if (!latestTarget) return
    triggerAuthorHighlight(latestTarget)
  })

  return true
}
