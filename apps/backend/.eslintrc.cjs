// packages/eslint-config-base/index.js
/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
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