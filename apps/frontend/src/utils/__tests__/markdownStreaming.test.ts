import { describe, it, expect } from 'vitest'
import { normalizeStreamingMarkdown } from '../markdownStreaming'

describe('normalizeStreamingMarkdown', () =>
{
  it('returns space for empty content', () =>
  {
    expect(normalizeStreamingMarkdown('', true)).toBe(' ')
    expect(normalizeStreamingMarkdown('', false)).toBe(' ')
  })

  it('returns content as-is when not streaming', () =>
  {
    const md = '# Hello\n```js\nconst x = 1'
    expect(normalizeStreamingMarkdown(md, false)).toBe(md)
  })

  it('does not modify complete markdown during streaming', () =>
  {
    const md = '# Title\n\n```js\nconst x = 1\n```\n\nDone.'
    expect(normalizeStreamingMarkdown(md, true)).toBe(md)
  })

  it('closes unclosed code fence during streaming', () =>
  {
    const md = '# Title\n\n```python\ndef foo():\n  pass'
    const result = normalizeStreamingMarkdown(md, true)
    expect(result).toBe(md + '\n```')
  })

  it('handles multiple complete fences without modification', () =>
  {
    const md = '```js\nfoo()\n```\n\n```py\nbar()\n```'
    expect(normalizeStreamingMarkdown(md, true)).toBe(md)
  })

  it('closes the last unclosed fence with multiple blocks', () =>
  {
    const md = '```js\nfoo()\n```\n\nSome text\n\n```py\nbar()'
    const result = normalizeStreamingMarkdown(md, true)
    expect(result).toBe(md + '\n```')
  })

  it('handles backtick-only fence (no language)', () =>
  {
    const md = 'Text\n```\nsome code'
    const result = normalizeStreamingMarkdown(md, true)
    expect(result).toBe(md + '\n```')
  })

  it('closes unclosed inline code backtick', () =>
  {
    const md = 'Use the `variable to do things'
    const result = normalizeStreamingMarkdown(md, true)
    expect(result).toBe(md + '`')
  })

  it('does not close already paired inline backticks', () =>
  {
    const md = 'Use `foo` and `bar` here'
    expect(normalizeStreamingMarkdown(md, true)).toBe(md)
  })

  it('handles mixed code fence and inline code', () =>
  {
    const md = '```js\nconst x = `hello`\n```\n\nUse `foo'
    const result = normalizeStreamingMarkdown(md, true)
    expect(result).toBe(md + '`')
  })

  it('handles quadruple backtick fences', () =>
  {
    const md = '````\nsome text'
    const result = normalizeStreamingMarkdown(md, true)
    expect(result.endsWith('\n```')).toBe(true)
  })

  it('returns content when streaming is false even if unclosed', () =>
  {
    const md = '```js\nconst x = 1'
    expect(normalizeStreamingMarkdown(md, false)).toBe(md)
  })

  it('handles content with only text during streaming', () =>
  {
    const md = 'Hello world, no code here.'
    expect(normalizeStreamingMarkdown(md, true)).toBe(md)
  })

  it('handles fence at very end of content', () =>
  {
    const md = 'Some text\n```'
    const result = normalizeStreamingMarkdown(md, true)
    expect(result).toBe(md + '\n```')
  })

  it('handles content being just a fence marker', () =>
  {
    const md = '```'
    const result = normalizeStreamingMarkdown(md, true)
    expect(result).toBe('```\n```')
  })
})
