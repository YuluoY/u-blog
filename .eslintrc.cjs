// packages/eslint-config-base/index.js
/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')


// 检测项目技术栈
function detectProjectStack() {
  try {
    const pkg = require('./package.json')
    const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies }
    
    return {
      isVue: !!deps.vue,
      isReact: !!deps.react,
      isTypeScript: !!deps.typescript || !!deps['@typescript-eslint/parser'],
      hasVuePlugin: !!deps['eslint-plugin-vue'],
      hasReactPlugin: !!deps['eslint-plugin-react']
    }
  } catch (error) {
    return {
      isVue: false,
      isReact: false,
      isTypeScript: false,
      hasVuePlugin: false,
      hasReactPlugin: false
    }
  }
}

const { isVue, isReact, isTypeScript, hasVuePlugin, hasReactPlugin } = detectProjectStack()

const config = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    // 通用规则
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    
    // CX工程自定义 - 通用规则
    quotes: ['error', 'single', { allowTemplateLiterals: true }],
    'generator-star-spacing': 'off',
    'no-undef': 'off',
    'no-new': 'warn',
    'no-tabs': 'off',
    'spaced-comment': 'warn',
    indent: ['error', 2],
    'no-multi-spaces': ['error', { ignoreEOLComments: true }],
    'brace-style': ['error', 'allman'],
    semi: ['error', 'never'],
    'comma-spacing': ['error', { before: false, after: true }],
    'no-trailing-spaces': ['error', { skipBlankLines: true }],
    'no-array-constructor': 'error',
    'no-new-object': 'error',
    'no-eval': 'off',
    'keyword-spacing': ['error', { after: true }],
    'no-multiple-empty-lines': [1, { max: 2 }],
    'space-before-function-paren': ['error', 'never'],
    'arrow-parens': ['error', 'as-needed'],
    curly: ['error', 'multi-or-nest'],
    'block-scoped-var': 'error',
    'no-unneeded-ternary': 'off',
    'prefer-const': 'off',
    'one-var': 'off',
    'one-var-declaration-per-line': 'off',
    'no-template-curly-in-string': 'warn',
    'no-dupe-keys': ['error'],
    'no-duplicate-case': ['error'],
    'no-empty': ['error', { allowEmptyCatch: true }],
    'linebreak-style': 'off',

    // TypeScript 特定规则
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
  },
}

// 如果是 Vue 项目，添加 Vue 特定配置
if (isVue) {
  config.extends.push('@vue/eslint-config-typescript')
  config.extends.push('@plugin:vue/vue3-essential')
  config.plugins.push('vue')
  
  // 添加 Vue 特定规则
  config.rules['vue/multi-word-component-names'] = 'off'
  config.rules['vue/no-reserved-component-names'] = 'off'
}

module.exports = config