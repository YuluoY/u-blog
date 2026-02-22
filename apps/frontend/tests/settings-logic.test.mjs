function faviconDisplayUrl(val) {
  if (!val) return ''
  return val
}

function maskValue(val) {
  if (typeof val !== 'string') return '***'
  if (val.length <= 6) return '***'
  return val.slice(0, 4) + '***'
}

const USER_SCOPED_KEYS = new Set([
  'openai_api_key', 'openai_base_url', 'openai_model',
  'openai_temperature', 'openai_max_tokens', 'openai_system_prompt', 'openai_context_length',
  'chat_font_size',
  'site_name', 'site_description', 'site_keywords', 'site_favicon',
])

const USER_PREFERENCE_KEYS = new Set([
  'theme', 'language', 'article_list_type', 'home_sort', 'visual_style',
  'openai_api_key', 'openai_base_url', 'openai_model',
  'openai_temperature', 'openai_max_tokens', 'openai_system_prompt', 'openai_context_length',
  'chat_font_size',
  'site_name', 'site_description', 'site_keywords', 'site_favicon',
])

let passed = 0
let failed = 0

function assert(condition, msg) {
  if (condition) {
    passed++
  } else {
    failed++
    console.error('FAIL:', msg)
  }
}

// === faviconDisplayUrl tests ===
assert(faviconDisplayUrl('') === '', 'empty string -> empty')
assert(faviconDisplayUrl('https://example.com/icon.png') === 'https://example.com/icon.png', 'absolute https URL')
assert(faviconDisplayUrl('http://example.com/icon.ico') === 'http://example.com/icon.ico', 'absolute http URL')
assert(faviconDisplayUrl('data:image/png;base64,abc') === 'data:image/png;base64,abc', 'data URI')
assert(faviconDisplayUrl('/uploads/123-abc.png') === '/uploads/123-abc.png', 'relative /uploads path')
assert(faviconDisplayUrl('uploads/123-abc.png') === 'uploads/123-abc.png', 'relative uploads path without leading /')

// === USER_SCOPED_KEYS contains site_* ===
assert(USER_SCOPED_KEYS.has('site_name'), 'site_name in USER_SCOPED_KEYS')
assert(USER_SCOPED_KEYS.has('site_description'), 'site_description in USER_SCOPED_KEYS')
assert(USER_SCOPED_KEYS.has('site_keywords'), 'site_keywords in USER_SCOPED_KEYS')
assert(USER_SCOPED_KEYS.has('site_favicon'), 'site_favicon in USER_SCOPED_KEYS')

// === USER_PREFERENCE_KEYS contains site_* ===
assert(USER_PREFERENCE_KEYS.has('site_name'), 'site_name in USER_PREFERENCE_KEYS')
assert(USER_PREFERENCE_KEYS.has('site_description'), 'site_description in USER_PREFERENCE_KEYS')
assert(USER_PREFERENCE_KEYS.has('site_keywords'), 'site_keywords in USER_PREFERENCE_KEYS')
assert(USER_PREFERENCE_KEYS.has('site_favicon'), 'site_favicon in USER_PREFERENCE_KEYS')

// === theme/language NOT in USER_SCOPED_KEYS (global) ===
assert(!USER_SCOPED_KEYS.has('theme'), 'theme NOT in USER_SCOPED_KEYS (global)')
assert(!USER_SCOPED_KEYS.has('language'), 'language NOT in USER_SCOPED_KEYS (global)')
assert(!USER_SCOPED_KEYS.has('visual_style'), 'visual_style NOT in USER_SCOPED_KEYS (global)')

// === maskValue tests ===
assert(maskValue('sk-abc123456789') === 'sk-a***', 'maskValue long string')
assert(maskValue('short') === '***', 'maskValue short <= 6')
assert(maskValue(123) === '***', 'maskValue non-string')
assert(maskValue('') === '***', 'maskValue empty string')

console.log(`\n${passed}/${passed + failed} tests passed`)
if (failed > 0) process.exit(1)
